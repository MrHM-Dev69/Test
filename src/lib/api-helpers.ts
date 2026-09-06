import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError) {
  return NextResponse.json(
    { error: "Validation failed", issues: error.issues.map((i) => ({ path: i.path, message: i.message })) },
    { status: 422 },
  );
}

export function isEmail(value: string): boolean {
  return value.includes("@");
}
