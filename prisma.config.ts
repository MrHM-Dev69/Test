import path from "node:path";
import fs from "node:fs";
import type { PrismaConfig } from "prisma";

// Prisma Config replaces the CLI's old implicit ".env auto-load" behavior,
// so we load it ourselves here to keep `prisma migrate`/`generate`/`db seed`
// working the same way they did before.
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
}

export default {
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
} satisfies PrismaConfig;
