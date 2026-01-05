import { enviarCorreo } from "../config/email.config.js";

// TODO: Deberiamos usar redis :C
const codigosVerificacion = new Map();

const TIEMPO_EXPIRACION = 5 * 60 * 1000;

/**
 * Genera un código de verificación de 6 dígitos
 * @returns {string} - Código de 6 dígitos
 */
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envía un código de verificación al email del usuario
 * @param {string} rut - RUT del usuario
 * @param {string} email - Email del usuario
 * @param {string} nombreCompleto - Nombre completo del usuario
 * @returns {Promise<Object>} - Resultado del envío
 */
export async function enviarCodigoVerificacion(rut, email, nombreCompleto) {
  try {
    const codigo = generarCodigo();
    const expiracion = Date.now() + TIEMPO_EXPIRACION;

    codigosVerificacion.set(rut, {
      codigo,
      email,
      expiracion,
      intentos: 0,
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #003876; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .code {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            color: #003876;
            background-color: #e8f4f8;
            padding: 20px;
            margin: 20px 0;
            letter-spacing: 5px;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .warning { color: #d9534f; font-size: 14px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sistema de Denuncias UBB</h1>
          </div>
          <div class="content">
            <h2>Verificación de Correo Electrónico</h2>
            <p>Hola <strong>${nombreCompleto}</strong>,</p>
            <p>Has solicitado realizar una denuncia en el Sistema de Denuncias de la Universidad del Bío-Bío.</p>
            <p>Para verificar tu identidad, ingresa el siguiente código de verificación:</p>

            <div class="code">${codigo}</div>

            <p>Este código es válido por <strong>5 minutos</strong>.</p>

            <p class="warning">
              <strong>⚠️ Importante:</strong> Si no solicitaste este código, ignora este mensaje.
              Tu información está segura.
            </p>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático, por favor no responder.</p>
            <p>Universidad del Bío-Bío | Sistema de Denuncias</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Sistema de Denuncias UBB

      Hola ${nombreCompleto},

      Has solicitado realizar una denuncia en el Sistema de Denuncias de la Universidad del Bío-Bío.

      Tu código de verificación es: ${codigo}

      Este código es válido por 5 minutos.

      Si no solicitaste este código, ignora este mensaje.
    `;

    const resultado = await enviarCorreo({
      to: email,
      subject: "Código de verificación - Sistema de Denuncias UBB",
      html,
      text,
    });

    if (resultado.success) {
      return {
        success: true,
        message: "Código de verificación enviado exitosamente",
        emailEnmascarado: enmascararEmail(email),
      };
    } else {
      codigosVerificacion.delete(rut);
      throw new Error("No se pudo enviar el código de verificación");
    }
  } catch (error) {
    console.error("Error enviando código de verificación:", error);
    throw error;
  }
}

/**
 * Verifica un código de verificación
 * @param {string} rut - RUT del usuario
 * @param {string} codigo - Código ingresado por el usuario
 * @returns {Object} - Resultado de la verificación
 */
export function verificarCodigo(rut, codigo) {
  const datosVerificacion = codigosVerificacion.get(rut);

  if (!datosVerificacion) {
    return {
      success: false,
      error: "No se encontró un código de verificación para este RUT",
    };
  }

  if (Date.now() > datosVerificacion.expiracion) {
    codigosVerificacion.delete(rut);
    return {
      success: false,
      error: "El código ha expirado. Solicita uno nuevo",
    };
  }

  datosVerificacion.intentos += 1;

  if (datosVerificacion.intentos > 3) {
    codigosVerificacion.delete(rut);
    return {
      success: false,
      error: "Demasiados intentos fallidos. Solicita un nuevo código",
    };
  }

  if (datosVerificacion.codigo !== codigo.trim()) {
    return {
      success: false,
      error: "Código incorrecto",
      intentosRestantes: 3 - datosVerificacion.intentos,
    };
  }

  codigosVerificacion.delete(rut);

  return {
    success: true,
    message: "Código verificado exitosamente",
  };
}

/**
 * Enmascara un email para mostrar solo parcialmente
 * @param {string} email - Email a enmascarar
 * @returns {string} - Email enmascarado
 */
function enmascararEmail(email) {
  if (!email) return "";

  const [nombre, dominio] = email.split("@");

  if (nombre.length <= 2) {
    return `${nombre[0]}***@${dominio}`;
  }

  const visible = nombre.slice(0, 2);
  const resto = "*".repeat(Math.min(nombre.length - 2, 5));

  return `${visible}${resto}@${dominio}`;
}

/**
 * Limpia códigos expirados periódicamente
 */
export function limpiarCodigosExpirados() {
  const ahora = Date.now();
  for (const [rut, datos] of codigosVerificacion.entries()) {
    if (ahora > datos.expiracion) {
      codigosVerificacion.delete(rut);
    }
  }
}

// Ejecutar limpieza cada 10 minutos
setInterval(limpiarCodigosExpirados, 10 * 60 * 1000);
