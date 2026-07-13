import { timingSafeEqual } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import { config } from "./config";
import { createOrder, createPaymentRefund, verifySignature } from "./razorpay";

const app = express();
app.use(express.json({ limit: "32kb" }));

function internalOnly(req: Request, res: Response, next: NextFunction) {
  const provided = req.header("x-payment-service-secret") ?? "";
  const expected = config.internalSecret;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (!expected || providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    res.status(401).json({ message: "Internal payment service access is required" });
    return;
  }
  next();
}

app.get("/health", (_req, res) => res.json({ success: true, service: "payment-service" }));

app.post("/payments/orders", internalOnly, async (req, res, next) => {
  try {
    res.status(201).json(await createOrder(req.body));
  } catch (error) {
    next(error);
  }
});

app.post("/payments/verify", internalOnly, (req, res) => {
  res.json({ valid: verifySignature(req.body) });
});

app.post("/payments/refunds", internalOnly, async (req, res, next) => {
  try {
    res.status(201).json(await createPaymentRefund(req.body));
  } catch (error) {
    next(error);
  }
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Payment service error", error.message);
  res.status(502).json({ message: error.message || "Payment provider request failed" });
});

app.listen(config.port, () => console.log(`Payment service listening on ${config.port}`));
