import { consumer } from "./config/kafka";
import { logger } from "./config/logger";
import nodemailer from "nodemailer";
import { config } from "./config/index";

const TOPICS = ["otp-email", "booking.confirmed", "booking.cancelled"];

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

async function sendBookingEmail(input: {
  email: string;
  pnr: string;
  trainName: string;
  trainNumber: string;
  journeyDate?: string;
  fromStation?: string;
  toStation?: string;
  passengerCount?: number;
  totalAmountPaise: number;
}, cancelled = false) {
  const subject = cancelled ? `Refund initiated for PNR ${input.pnr}` : `Your IRCT ticket is confirmed — PNR ${input.pnr}`;
  const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(input.totalAmountPaise / 100);
  const details = cancelled
    ? `<p>Your full refund of <strong>${amount}</strong> has been initiated to your original payment method.</p>`
    : `<p><strong>${input.trainName} (${input.trainNumber})</strong></p>
       <p>${input.fromStation} → ${input.toStation}</p>
       <p>Journey: ${input.journeyDate ? new Date(input.journeyDate).toLocaleDateString("en-IN") : "—"} · ${input.passengerCount} passenger(s)</p>
       <p>Paid: <strong>${amount}</strong></p>`;

  await getTransporter().sendMail({
    from: config.smtp.from,
    to: input.email,
    subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1d2433">
      <h2>${cancelled ? "Cancellation confirmed" : "You're on the list!"}</h2>
      <p>PNR: <strong style="letter-spacing:1px">${input.pnr}</strong></p>
      ${details}
      <p style="color:#667085;font-size:12px">Keep this email as your digital ticket.</p>
    </div>`,
  });
}

async function start() {
  await consumer.connect();
  logger.info("Connected to Kafka");

  await consumer.subscribe({ topics: TOPICS, fromBeginning: false });
  logger.info(`Subscribed to topics: ${TOPICS.join(", ")}`);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const key = message.key?.toString();
      const raw = message.value?.toString();

      if (!raw) {
        logger.warn(`Empty message received on ${topic}`);
        return;
      }

      try {
        const messageBody = JSON.parse(raw) as { data?: Record<string, unknown>; email?: string; otp?: string; expiryTime?: number };
        if (topic === "otp-email") {
          const { email, otp, expiryTime } = messageBody;
          if (!email || !otp || !expiryTime) throw new Error("Invalid OTP email payload");
          logger.info(`Processing OTP email for ${email} (partition: ${partition}, offset: ${message.offset})`);
          await sendOtpEmail(email, otp, expiryTime);
          return;
        }

        const data = messageBody.data as {
          email?: string; pnr?: string; trainName?: string; trainNumber?: string; journeyDate?: string;
          fromStation?: string; toStation?: string; passengerCount?: number; totalAmountPaise?: number;
        } | undefined;
        if (!data?.email || !data.pnr || !data.trainName || !data.trainNumber || !data.totalAmountPaise) {
          throw new Error("Invalid booking notification payload");
        }
        await sendBookingEmail({
          email: data.email,
          pnr: data.pnr,
          trainName: data.trainName,
          trainNumber: data.trainNumber,
          journeyDate: data.journeyDate,
          fromStation: data.fromStation,
          toStation: data.toStation,
          passengerCount: data.passengerCount,
          totalAmountPaise: data.totalAmountPaise,
        }, topic === "booking.cancelled");
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
