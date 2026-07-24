import { D1AcademiaRepository } from "./d1";
import type { AcademiaRepository } from "./types";

let repository: AcademiaRepository | undefined;

export function getRepository(): AcademiaRepository {
  repository ??= new D1AcademiaRepository();
  return repository;
}
