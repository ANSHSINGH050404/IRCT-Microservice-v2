import { config } from "../config";
import { BadRequestError } from "../utils/error";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  keyId: string;
};

async function paymentRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${config.paymentServiceUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-payment-service-secret": config.paymentServiceSecret,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  const payload = await response.json().catch(() => ({})) as { message?: string } & T;
  if (!response.ok) {
    throw new BadRequestError(payload.message ?? "Payment provider is currently unavailable");
  }
  return payload;
}

export function createPaymentOrder(bookingId: string, amountPaise: number) {
  return paymentRequest<RazorpayOrder>("/payments/orders", {
    receipt: `booking_${bookingId}`.slice(0, 40),
    amountPaise,
    currency: "INR",
  });
}

export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  return paymentRequest<{ valid: boolean }>("/payments/verify", input);
}

export function createRefund(paymentId: string, amountPaise: number, bookingId: string) {
  return paymentRequest<{ id: string; status: string }>("/payments/refunds", {
    paymentId,
    amountPaise,
    receipt: `refund_${bookingId}`.slice(0, 40),
  });
}
