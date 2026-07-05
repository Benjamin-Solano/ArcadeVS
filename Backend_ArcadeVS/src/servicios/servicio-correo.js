/**
 * Servicio de correo — única pieza del backend que envía correos.
 *
 * Selecciona el transporte según el entorno (leído en cada llamada, como
 * configuracion-autenticacion): con CORREO_HABILITADO='true' y SMTP configurado
 * envía por Gmail vía Nodemailer; en caso contrario usa un "transporte de
 * desarrollo" que solo imprime el código en consola. Así los tests y el
 * desarrollo local no envían correos reales.
 *
 * El envío es best-effort: un fallo de SMTP se registra pero no se propaga, para
 * no romper el registro (el usuario siempre puede pedir un reenvío del código).
 */

import nodemailer from 'nodemailer';

/** Remitente por defecto si no se define CORREO_REMITENTE. */
const REMITENTE_POR_DEFECTO = 'ArcadeVS <no-reply@arcadevs.local>';

/** @returns {boolean} true si el envío real por SMTP está habilitado y configurado. */
function correo_habilitado() {
  return (
    process.env.CORREO_HABILITADO === 'true' &&
    Boolean(process.env.SMTP_HOST) &&
    Boolean(process.env.SMTP_USUARIO) &&
    Boolean(process.env.SMTP_CONTRASENA)
  );
}

/**
 * Construye el transporte de Nodemailer a partir de las variables SMTP.
 * Se crea por llamada (el volumen de correos es bajo: registro/reenvío).
 *
 * @returns {import('nodemailer').Transporter} Transporte SMTP configurado.
 */
function crear_transporte() {
  const puerto = Number(process.env.SMTP_PUERTO) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: puerto,
    secure: puerto === 465, // 465 = SSL directo; 587 = STARTTLS.
    auth: {
      user: process.env.SMTP_USUARIO,
      pass: process.env.SMTP_CONTRASENA,
    },
  });
}

/**
 * Cuerpo HTML del correo de verificación, con estética CRT en español.
 *
 * @param {string} codigo - Código de 6 dígitos a mostrar.
 * @returns {string} HTML del correo.
 */
function plantilla_codigo(codigo) {
  return `
    <div style="background:#12060f;padding:32px;font-family:monospace;color:#ffd9ec;text-align:center">
      <h1 style="letter-spacing:0.12em;color:#ff4fa3">ARCADEVS</h1>
      <p style="letter-spacing:0.10em">TU CÓDIGO DE VERIFICACIÓN ES:</p>
      <p style="font-size:34px;letter-spacing:0.30em;color:#ff4fa3;font-weight:bold">${codigo}</p>
      <p style="letter-spacing:0.10em;font-size:12px;color:#c98fb0">EXPIRA EN 15 MINUTOS. NO LO COMPARTAS CON NADIE.</p>
    </div>
  `;
}

/**
 * Envía el código de verificación al correo indicado. En modo desarrollo (sin
 * SMTP habilitado) solo lo registra en consola.
 *
 * @param {string} correo - Destinatario.
 * @param {string} codigo - Código de 6 dígitos.
 * @returns {Promise<void>}
 */
export async function enviar_codigo_verificacion(correo, codigo) {
  if (!correo_habilitado()) {
    // Modo desarrollo: el código queda visible en la consola del backend.
    console.info(`[CORREO][DEV] para=${correo} codigo=${codigo}`);
    return;
  }

  try {
    const transporte = crear_transporte();
    await transporte.sendMail({
      from: process.env.CORREO_REMITENTE || REMITENTE_POR_DEFECTO,
      to: correo,
      subject: 'ARCADEVS · Código de verificación',
      text: `Tu código de verificación es ${codigo}. Expira en 15 minutos.`,
      html: plantilla_codigo(codigo),
    });
  } catch (error) {
    // Best-effort: no romper el flujo de registro si el correo falla.
    console.error(`[CORREO] Fallo al enviar a ${correo}: ${error.message}`);
  }
}
