// Use CommonJS require to avoid missing type declaration issues for SendGrid.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail: any = require('@sendgrid/mail');
import { config } from './env';

sgMail.setApiKey(config.SENDGRID_API_KEY);

interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (payload: EmailPayload): Promise<boolean> => {
  try {
    if (!config.SENDGRID_API_KEY) {
      console.warn('⚠️  SendGrid API key not configured. Email not sent.');
      return false;
    }

    const msg = {
      to: payload.to,
      from: config.SENDER_EMAIL,
      subject: payload.subject,
      text: payload.text || '',
      html: payload.html || '',
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${payload.to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

export default sendEmail;