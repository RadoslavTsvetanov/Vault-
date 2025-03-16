import type { Secret } from "../../models/secret";

export interface SecretRepository {
  findByUserIdAndKey(userId: string, key: string): Secret | undefined;
  create(userId: string, key: string, value: string): Secret;
  listByUserId(userId: string): Secret[];
}
