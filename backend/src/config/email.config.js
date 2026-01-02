// src/config/email.config.js
import nodemailer from 'nodemailer';

// Configuración del transporter de nodemailer
export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar conexión al inicializar
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en configuración de email:', error.message);
  } else {
    console.log('✅ Servidor de correo listo');
  }
});

// Función helper para enviar correos
export async function enviarCorreo({ to, subject, html, text }) {
  try {
    const info = await emailTransporter.sendMail({
      from: `"Sistema de Denuncias UBB" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando correo:', error);
    return { success: false, error: error.message };
  }
}

