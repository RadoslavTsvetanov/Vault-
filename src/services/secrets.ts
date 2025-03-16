import type { Secret } from "../models/secret";
import type { SecretRepository } from "../respositories/interfaces/secrets";

export class SecretService {
  constructor(private secretRepository: SecretRepository) {}

  createSecret(userId: string, key: string, value: string): Secret {
    const existingSecret = this.secretRepository.findByUserIdAndKey(
      userId,
      key
    );

    if (existingSecret) {
      throw new Error(`Secret with key '${key}' already exists`);
    }

    return this.secretRepository.create(userId, key, value);
  }

  getSecret(userId: string, key: string): Secret | undefined {
    return this.secretRepository.findByUserIdAndKey(userId, key);
  }

  listSecrets(userId: string): Secret[] {
    return this.secretRepository.listByUserId(userId);
  }
}
