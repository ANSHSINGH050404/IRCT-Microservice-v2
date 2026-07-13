import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT ?? "4004", 10),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  internalSecret: process.env.PAYMENT_SERVICE_SECRET ?? "",
};
