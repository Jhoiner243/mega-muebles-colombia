import { Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { envs } from '../../config/envs';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize email transporter if SMTP is configured
    if (envs.smtp.host && envs.smtp.port && envs.smtp.user && envs.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: envs.smtp.host,
        port: envs.smtp.port,
        secure: envs.smtp.port === 465,
        auth: {
          user: envs.smtp.user,
          pass: envs.smtp.pass,
        },
      });
    }
  }

  async sendOrderConfirmation(
    order: Order & { user?: { email: string; fullName: string } }
  ) {
    if (!order.user?.email) {
      this.logger.warn(`No email found for order ${order.id}`);
      return;
    }

    const subject = `Confirmación de Pedido #${order.orderNumber} - Mega Muebles`;
    const html = this.getOrderConfirmationEmail(order);

    await this.sendEmail(order.user.email, subject, html);
  }

  async sendOrderStatusUpdate(
    order: Order & { user?: { email: string; fullName: string } },
    oldStatus: OrderStatus,
    newStatus: OrderStatus
  ) {
    if (!order.user?.email) {
      return;
    }

    const subject = `Actualización de Pedido #${order.orderNumber} - Mega Muebles`;
    const html = this.getOrderStatusUpdateEmail(order, oldStatus, newStatus);

    await this.sendEmail(order.user.email, subject, html);
  }

  async sendShippingNotification(
    order: Order & {
      user?: { email: string; fullName: string; phone?: string };
      trackingNumber?: string;
    }
  ) {
    if (!order.user?.email) {
      return;
    }

    const subject = `Tu Pedido #${order.orderNumber} ha sido enviado - Mega Muebles`;
    const html = this.getShippingNotificationEmail(order);

    await this.sendEmail(order.user.email, subject, html);

    // Send SMS if Twilio is configured
    if (order.user.phone && envs.twilio.accountSid) {
      await this.sendSMS(
        order.user.phone,
        `Tu pedido #${
          order.orderNumber
        } ha sido enviado. Número de seguimiento: ${
          order.trackingNumber || 'N/A'
        }`
      );
    }
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping email send.'
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: envs.smtp.user,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
    }
  }

  private async sendSMS(to: string, message: string) {
    // In production, integrate with Twilio
    // For now, just log
    this.logger.log(`SMS to ${to}: ${message}`);
  }

  private getOrderConfirmationEmail(
    order: Order & { user?: { fullName: string } }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Pedido</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">¡Gracias por tu compra!</h1>
          <p>Hola ${order.user?.fullName || 'Cliente'},</p>
          <p>Tu pedido ha sido recibido y está siendo procesado.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Detalles del Pedido</h2>
            <p><strong>Número de Pedido:</strong> #${order.orderNumber}</p>
            <p><strong>Fecha:</strong> ${new Date(
              order.createdAt
            ).toLocaleDateString('es-CO')}</p>
            <p><strong>Total:</strong> $${order.total.toLocaleString()}</p>
            <p><strong>Estado:</strong> ${this.getStatusLabel(order.status)}</p>
          </div>

          <p>Te notificaremos cuando tu pedido sea enviado.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <p>Saludos,<br>El equipo de Mega Muebles</p>
        </div>
      </body>
      </html>
    `;
  }

  private getOrderStatusUpdateEmail(
    order: Order & { user?: { fullName: string } },
    oldStatus: OrderStatus,
    newStatus: OrderStatus
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de Pedido</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Actualización de tu Pedido</h1>
          <p>Hola ${order.user?.fullName || 'Cliente'},</p>
          <p>El estado de tu pedido #${order.orderNumber} ha cambiado:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Estado anterior:</strong> ${this.getStatusLabel(
              oldStatus
            )}</p>
            <p><strong>Estado actual:</strong> ${this.getStatusLabel(
              newStatus
            )}</p>
          </div>

          <p>Gracias por tu paciencia.</p>
          
          <p>Saludos,<br>El equipo de Mega Muebles</p>
        </div>
      </body>
      </html>
    `;
  }

  private getShippingNotificationEmail(
    order: Order & { user?: { fullName: string }; trackingNumber?: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pedido Enviado</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">¡Tu pedido ha sido enviado!</h1>
          <p>Hola ${order.user?.fullName || 'Cliente'},</p>
          <p>Tu pedido #${
            order.orderNumber
          } ha sido enviado y está en camino.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Información de Envío</h2>
            ${
              order.trackingNumber
                ? `<p><strong>Número de Seguimiento:</strong> ${order.trackingNumber}</p>`
                : ''
            }
            ${
              order.carrier
                ? `<p><strong>Transportadora:</strong> ${order.carrier}</p>`
                : ''
            }
            ${
              order.estimatedDelivery
                ? `<p><strong>Fecha Estimada de Entrega:</strong> ${new Date(
                    order.estimatedDelivery
                  ).toLocaleDateString('es-CO')}</p>`
                : ''
            }
          </div>

          <p>Puedes rastrear tu pedido usando el número de seguimiento proporcionado.</p>
          
          <p>Saludos,<br>El equipo de Mega Muebles</p>
        </div>
      </body>
      </html>
    `;
  }

  private getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Pendiente',
      PAID: 'Pagado',
      PROCESSING: 'En Proceso',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
      RETURNED: 'Devuelto',
    };
    return labels[status] || status;
  }
}
