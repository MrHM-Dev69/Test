import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function getTransport() {
  if (!env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
}

export async function sendEmail(input: {
  toEmail: string;
  subject: string;
  html: string;
  templateKey?: string;
}) {
  const transport = getTransport();
  let status = "SENT";
  let error: string | undefined;

  if (!transport) {
    status = "FAILED";
    error = "SMTP_HOST is not configured";
  } else {
    try {
      await transport.sendMail({
        from: env.SMTP_FROM,
        to: input.toEmail,
        subject: input.subject,
        html: input.html,
      });
    } catch (err) {
      status = "FAILED";
      error = err instanceof Error ? err.message : "Unknown email error";
    }
  }

  await prisma.emailLog.create({
    data: {
      toEmail: input.toEmail,
      subject: input.subject,
      templateKey: input.templateKey,
      status,
      error,
    },
  });

  return { ok: status === "SENT", error };
}

export * from "./templates";
