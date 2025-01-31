import * as dotenv from "dotenv";
dotenv.config();

type EnvRecord<T extends string> = Record<T, string>;

type EnvEntry<T extends string> = {
  key: T;
  handler?: (value: string) => string;
};

class EnvManager<T extends string> {
  private envValues: EnvRecord<T> = {} as EnvRecord<T>;

  constructor(entries: EnvEntry<T>[]) {
    for (const entry of entries) {
      const envValue = process.env[entry.key];
      if (envValue !== undefined) {
        this.envValues[entry.key] = entry.handler
          ? entry.handler(envValue)
          : envValue;
      } else {
        throw new Error(`Environment variable ${entry.key} is not defined`);
      }
    }

    Object.keys(this.envValues).forEach((key) => {
      // @ts-ignore to allow dynamic key creation
      this[key] = this.envValues[key];
    });
  }

  get<K extends T>(key: K): string {
    const value = this.envValues[key];
    if (value !== undefined) {
      return value;
    }
    throw new Error(`Environment variable ${key} was not found`);
  }

  getAll(): EnvRecord<T> {
    return this.envValues;
  }
}

export const envManager = new EnvManager([
    {
        key: "MONGO_URI"
    },
    {
        key: "ADMIN_COLLECTION_KEYSTRING_FOR_AES_WHICH_HAS_TO_BE_32_BYTES"
    },
    {
        key: "ADMIN_IV_STRING_16_BYTES"
    },
    {
        key: "SECRETS_KEYSTRING"
    },
    {
        key: "SECRETS_IV_STRING"
    }
]);
