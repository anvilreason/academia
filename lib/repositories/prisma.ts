import type { AcademiaRepository } from "./types";

/**
 * Production adapter boundary for Alibaba Cloud PostgreSQL.
 *
 * The preview is deliberately backed by D1. When RDS is provisioned this
 * adapter will implement the same repository contract with Prisma, leaving
 * routes, permissions and the LLM gateway unchanged.
 */
export class PrismaAcademiaRepository {
  static create(): AcademiaRepository {
    throw new Error(
      "PostgreSQL/Prisma production adapter is not enabled in preview.",
    );
  }
}
