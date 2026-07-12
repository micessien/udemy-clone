import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  // allow global `var` declarations
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing in environment");
}

const parsed = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: Number(parsed.port || 3306),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, ""),
});

export const db =
  globalThis.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
