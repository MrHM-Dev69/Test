export interface SendSmsInput {
  toPhone: string;
  body: string;
  templateKey?: string;
}

export interface SendSmsResult {
  ok: boolean;
  providerRef?: string;
  error?: string;
}

export interface SmsProviderAdapter {
  name: string;
  send(input: SendSmsInput): Promise<SendSmsResult>;
}
