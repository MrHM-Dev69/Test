export interface InitiatePaymentInput {
  orderId: string;
  amountRial: number; // gateway APIs speak Rial; convert from Toman at the edge
  description: string;
  callbackUrl: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
}

export interface InitiatePaymentResult {
  authority: string; // provider-specific transaction/authority token
  redirectUrl: string;
}

export interface VerifyPaymentInput {
  authority: string;
  amountRial: number;
  // Raw query params/body the gateway redirected back with, provider-specific.
  callbackParams: Record<string, string>;
}

export type VerifyPaymentResult =
  | { ok: true; refId: string; raw: unknown }
  | { ok: false; errorCode?: string; raw: unknown };

export interface PaymentProviderAdapter {
  name: string;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verify(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  /** Verifies an async webhook's authenticity (signature/HMAC), independent of the redirect-based verify(). */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}
