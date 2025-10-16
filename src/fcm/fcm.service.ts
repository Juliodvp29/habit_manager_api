import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import { Repository } from 'typeorm';
import { DeviceToken, DeviceType } from '../entities/device-token.entity';
import { Notification } from '../entities/notification.entity';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(
    private configService: ConfigService,
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) { }

  async onModuleInit() {
    await this.initializeFirebase();
  }

  // Inicializar Firebase Admin SDK
  private async initializeFirebase() {
    try {
      // Opción 1: Usar archivo JSON directamente
      const credentialsPath = this.configService.get('FIREBASE_CREDENTIALS_PATH');

      if (credentialsPath) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(credentialsPath),
        });
      } else {
        // Opción 2: Usar variables de entorno individuales
        const projectId = this.configService.get('FIREBASE_PROJECT_ID');
        const privateKey = this.configService
          .get('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n');
        const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');

        if (!projectId || !privateKey || !clientEmail) {
          console.warn('⚠️ Firebase credentials not configured. Push notifications disabled.');
          return;
        }

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
      }

      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
    }
  }

  // Registrar token de dispositivo
  async registerDeviceToken(
    userId: number,
    token: string,
    deviceType: DeviceType,
    deviceName?: string,
  ): Promise<DeviceToken> {
    // Verificar si el token ya existe
    let deviceToken = await this.deviceTokenRepository.findOne({
      where: { token },
    });

    if (deviceToken) {
      // Actualizar token existente
      deviceToken.user = { id: userId } as any;
      deviceToken.deviceType = deviceType;
      deviceToken.deviceName = deviceName || deviceToken.deviceName;
      deviceToken.isActive = true;
      deviceToken.lastUsedAt = new Date();
    } else {
      // Crear nuevo token
      deviceToken = this.deviceTokenRepository.create({
        user: { id: userId },
        token,
        deviceType,
        deviceName,
      });
    }

    return await this.deviceTokenRepository.save(deviceToken);
  }

  // Eliminar token de dispositivo (logout)
  async unregisterDeviceToken(token: string): Promise<void> {
    await this.deviceTokenRepository.update({ token }, { isActive: false });
  }

  // Obtener tokens activos de un usuario
  async getUserDeviceTokens(userId: number): Promise<string[]> {
    const devices = await this.deviceTokenRepository.find({
      where: { user: { id: userId }, isActive: true },
    });

    return devices.map((d) => d.token);
  }

  // Enviar notificación push a un usuario
  async sendPushToUser(
    userId: number,
    payload: PushNotificationPayload,
  ): Promise<{ success: number; failure: number; errors: string[] }> {
    if (!this.firebaseApp) {
      console.warn('Firebase not initialized. Skipping push notification.');
      return { success: 0, failure: 0, errors: ['Firebase not configured'] };
    }

    const tokens = await this.getUserDeviceTokens(userId);

    if (tokens.length === 0) {
      console.log(`No active device tokens for user ${userId}`);
      return { success: 0, failure: 0, errors: ['No active tokens'] };
    }

    return await this.sendPushToTokens(tokens, payload);
  }

  // Enviar notificación push a múltiples tokens
  async sendPushToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ success: number; failure: number; errors: string[] }> {
    if (!this.firebaseApp) {
      return { success: 0, failure: 0, errors: ['Firebase not configured'] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        tokens,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: payload.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Desactivar tokens inválidos
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(tokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await this.deviceTokenRepository.update(
          { token: { $in: invalidTokens } as any },
          { isActive: false },
        );
      }

      const errors = response.responses
        .filter((r) => !r.success)
        .map((r) => r.error?.message || 'Unknown error');

      console.log(
        `📱 Push sent: ${response.successCount} success, ${response.failureCount} failed`,
      );

      return {
        success: response.successCount,
        failure: response.failureCount,
        errors,
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: 0, failure: tokens.length, errors: [error.message] };
    }
  }

  // Enviar notificación desde la BD y marcarla como enviada
  async sendPushForNotification(notificationId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['user'],
    });

    if (!notification) {
      console.error(`Notification ${notificationId} not found`);
      return;
    }

    if (notification.pushSent) {
      console.log(`Notification ${notificationId} already sent`);
      return;
    }

    try {
      const result = await this.sendPushToUser(notification.user.id, {
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notificationId.toString(),
          type: 'habit_reminder',
        },
      });

      // Actualizar estado de la notificación
      await this.notificationRepository.update(notificationId, {
        pushSent: true,
        pushSentAt: new Date(),
        pushError: result.errors.length > 0 ? result.errors.join(', ') : undefined,
      });

      console.log(`✅ Push notification ${notificationId} sent successfully`);
    } catch (error) {
      console.error(`Error sending push for notification ${notificationId}:`, error);
      await this.notificationRepository.update(notificationId, {
        pushError: error.message,
      });
    }
  }

  // Enviar notificación push a múltiples usuarios (broadcast)
  async sendPushBroadcast(
    userIds: number[],
    payload: PushNotificationPayload,
  ): Promise<void> {
    for (const userId of userIds) {
      await this.sendPushToUser(userId, payload);
    }
  }
}