const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testEmail() {
  console.log("Testing SMTP directly with credentials from .env.local...");
  
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.MAIL_PORT) || 587,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: 'contrerasramiro1098@gmail.com',
      subject: 'ICSA Direct SMTP Test',
      html: '<h1>SMTP Working</h1><p>Test from direct Nodemailer script.</p>'
    });
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Email failed:", error);
  }
}

testEmail();
