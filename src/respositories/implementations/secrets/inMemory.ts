import { randomUUID } from "crypto";
import type { SecretRepository } from "../../interfaces/secrets";
import type { Secret } from "../../../models/secret";

export class InMemorySecretRepository implements SecretRepository {
  private secrets: Secret[] = [];

  findByUserIdAndKey(userId: string, key: string): Secret | undefined {
    return this.secrets.find(
      (secret) => secret.userId === userId && secret.key === key
    );
  }

  create(userId: string, key: string, value: string): Secret {
    const secret: Secret = {
      id: randomUUID(),
      userId,
      key,
      value,
      createdAt: new Date(),
    };
    this.secrets.push(secret);
    return secret;
  }

  listByUserId(userId: string): Secret[] {
    return this.secrets.filter((secret) => secret.userId === userId);
  }
}
