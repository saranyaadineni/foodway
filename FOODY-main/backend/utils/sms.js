import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const sendSms = async (to, body) => {
  try {
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });
    console.log(`SMS sent to ${to}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error);
    throw error;
  }
};
