import path from "node:path";
import fs from "node:fs";
import type { PrismaConfig } from "prisma";

// Prisma Config replaces the CLI's old implicit ".env auto-load" behavior,
// so we load it ourselves here to keep `prisma migrate`/`generate`/`db seed`
// working the same way they did before.
//
// Deliberately uses process.cwd() rather than __dirname: this file is
// loaded through Prisma's own bundler, under which __dirname can resolve
// to an internal/temp location instead of the project root (observed on
// Windows). process.cwd() is reliable as long as Prisma commands are run
// from the project root, which is the standard/expected usage.
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const rawLine of fs.readFileSync(envPath, "utf8").split("\n")) {
    const line = rawLine.trim().replace(/\r$/, "");
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
    }
  }
}

export default {
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
} satisfies PrismaConfig;
