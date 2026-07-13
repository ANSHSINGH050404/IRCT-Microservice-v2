import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";

type RazorpayError = { error?: { description?: string } };

function assertConfigured() {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error("Razorpay credentials are not configured");
  }
}

async function razorpayRequest<T>(path: string, method: "POST", body: Record<string, unknown>) {
  assertConfigured();
  const authorization = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { authorization: `Basic ${authorization}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => ({})) as T & RazorpayError;
  if (!response.ok) throw new Error(payload.error?.description ?? "Razorpay request failed");
  return payload;
}

export async function createOrder(input: { amountPaise: number; currency: string; receipt: string }) {
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new Error("Payment amount must be at least ₹1");
  }
  const order = await razorpayRequest<{ id: string; amount: number; currency: string }>("/orders", "POST", {
    amount: input.amountPaise,
    currency: input.currency,
    receipt: input.receipt,
    payment_capture: 1,
  });
  return { ...order, keyId: config.razorpayKeyId };
}

export function verifySignature(input: { orderId: string; paymentId: string; signature: string }) {
  if (!input.orderId || !input.paymentId || !input.signature || !config.razorpayKeySecret) return false;
  const expected = createHmac("sha256", config.razorpayKeySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  const provided = Buffer.from(input.signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return provided.length === expectedBuffer.length && timingSafeEqual(provided, expectedBuffer);
}

export async function createPaymentRefund(input: { paymentId: string; amountPaise: number; receipt: string }) {
  if (!input.paymentId || !Number.isSafeInteger(input.amountPaise) || input.amountPaise < 1) {
    throw new Error("Refund details are invalid");
  }
  return razorpayRequest<{ id: string; status: string }>(`/payments/${encodeURIComponent(input.paymentId)}/refund`, "POST", {
    amount: input.amountPaise,
    receipt: input.receipt,
    speed: "normal",
  });
}
