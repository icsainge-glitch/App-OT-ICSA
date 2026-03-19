import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Sends an email using SMTP transport with Nodemailer and Brevo credentials.
 * 
 * @param options Object containing recipient, subject, html content and optional attachments.
 */
export async function sendEmailSMTP(options: EmailOptions) {
  const host = process.env.MAIL_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.MAIL_PORT) || 587;
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;

  console.log(`Intentando conectar a SMTP: ${host}:${port} (SSL/TLS: ${port === 465})`);

  if (!user || !pass) {
    const missing = [];
    if (!user) missing.push("MAIL_USERNAME");
    if (!pass) missing.push("MAIL_PASSWORD");
    
    console.error(`ERROR DE CONFIGURACIÓN: Faltan variables de entorno: ${missing.join(", ")}`);
    console.log("Variables de entorno relacionadas detectadas:", Object.keys(process.env).filter(k => k.startsWith('MAIL_')));
    
    throw new Error(`Configuración de correo incompleta. Faltan: ${missing.join(", ")}. Por favor, verifica tu .env.local y REINICIA el servidor (npm run dev).`);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false 
    }
  });

  try {
    const fromName = process.env.MAIL_FROM_NAME || "ICSA Operaciones";
    const fromAddress = process.env.MAIL_FROM_ADDRESS || "no-reply@icsa.com";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    
    console.log(`Email enviado con éxito vía Brevo. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error enviando email vía SMTP (Brevo):", error);
    
    // Identificar errores de DNS (ENOTFOUND)
    if (error.code === 'ENOTFOUND') {
      console.error(`ERROR DE DNS: No se pudo encontrar la dirección ${host}. Por favor verifique su conexión a internet o configuración de DNS.`);
      throw new Error(`Error de red: No se pudo resolver la dirección del servidor de correo (${host}). Verifique su conexión.`);
    }

    // Catch specific SMTP auth error to provide a better debug message
    if (error.responseCode === 535) {
      throw new Error("Fallo de autenticación SMTP. Por favor verifique su clave SMTP en el archivo .env.");
    }
    
    throw error;
  }
}
