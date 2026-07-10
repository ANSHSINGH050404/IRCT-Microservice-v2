import { consumer } from "./config/kafka";
import { logger } from "./config/logger";
import nodemailer from "nodemailer";
import { config } from "./config/index";

const TOPIC = "otp-email";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!config.smtp.user || !config.smtp.pass) {
      throw new Error("SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.");
    }
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

async function sendOtpEmail(email: string, otp: string, expiryTime: number) {
  const mailOptions = {
    from: config.smtp.from,
    to: email,
    subject: "Your OTP for IRCT Registration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your One-Time Password (OTP) for registration is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
             padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
          ${otp}
        </div>
        <p>This OTP is valid for ${expiryTime} minutes.</p>
        <p style="color: #6b7280; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  const info = await getTransporter().sendMail(mailOptions);
  logger.info(`OTP email sent to ${email}: ${info.messageId}`);
}

async function start() {
  await consumer.connect();
  logger.info("Connected to Kafka");

  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  logger.info(`Subscribed to topic: ${TOPIC}`);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const key = message.key?.toString();
      const raw = message.value?.toString();

      if (!raw) {
        logger.warn(`Empty message received on ${topic}`);
        return;
      }

      try {
        const { email, otp, expiryTime } = JSON.parse(raw) as {
          email: string;
          otp: string;
          expiryTime: number;
        };

        logger.info(`Processing OTP email for ${email} (partition: ${partition}, offset: ${message.offset})`);
        await sendOtpEmail(email, otp, expiryTime);
      } catch (err) {
        logger.error(`Failed to process message from ${topic}: ${err}`);
      }
    },
  });
}

start().catch((err) => {
  logger.error(`Fatal error: ${err}`);
  process.exit(1);
});
