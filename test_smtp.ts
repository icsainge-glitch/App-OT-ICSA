import { sendEmailSMTP } from './src/ai/services/email';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testEmail() {
  console.log("Testing SMTP...");
  try {
    const result = await sendEmailSMTP({
      to: 'contrerasramiro1098@gmail.com', // Using the email seen in DB logs
      subject: 'ICSA SMTP Test',
      html: '<h1>SMTP Working</h1><p>Test from Antigravity diagnostic script.</p>'
    });
    console.log("Email test result:", result);
  } catch (error) {
    console.error("Email test failed:", error);
  }
}

testEmail();
