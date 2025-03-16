import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { randomUUID } from "crypto";
import type { User } from "./models/user";
import type { Secret } from "./models/secret";
import type { Session } from "./models/session";
import { InMemoryUserRepository } from "./respositories/implementations/user/inMemory";
import { InMemorySecretRepository } from "./respositories/implementations/secrets/inMemory";
import { InMemorySessionRepository } from "./respositories/implementations/session/inMemory";
import { AuthService } from "./services/auth";
import { SecretService } from "./services/secrets";


// Initialize repositories and services
const userRepository = new InMemoryUserRepository();
const defaultUser = userRepository.create("admin", "password");
console.log("Default user created:", { username: "admin", password: "password" });
const secretRepository = new InMemorySecretRepository();
const sessionRepository = new InMemorySessionRepository();
const authService = new AuthService(userRepository, sessionRepository);
const secretService = new SecretService(secretRepository);

// Define request/response schemas for swagger
const AuthRequest = t.Object({
  username: t.String({
    description: "User account username",
    examples: ["john.doe"],
  }),
  password: t.String({
    description: "User account password",
    examples: ["secure-password"],
  }),
});

const AuthResponse = t.Object({
  success: t.Boolean(),
  sessionId: t.Optional(t.String()),
  userId: t.Optional(t.String()),
  message: t.Optional(t.String()),
});

const SecretRequest = t.Object({
  key: t.String({
    description: "Unique key to identify the secret",
    examples: ["api_key", "database_password"],
  }),
  value: t.String({
    description: "The secret value to be stored",
    examples: ["my-secret-value"],
  }),
});

const SecretResponse = t.Object({
  success: t.Boolean(),
  secret: t.Optional(
    t.Object({
      id: t.Optional(t.String()),
      key: t.String(),
      value: t.Optional(t.String()),
      createdAt: t.Optional(t.Date()),
    })
  ),
  message: t.Optional(t.String()),
});

const SecretsListResponse = t.Object({
  success: t.Boolean(),
  secrets: t.Array(
    t.Object({
      id: t.String(),
      key: t.String(),
      createdAt: t.Date(),
    })
  ),
});

// Set up the Elysia app
const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Elysia Secrets API",
          version: "1.0.0",
          description: "A secure API for storing and retrieving secrets",
        },
        tags: [
          { name: "authentication", description: "Authentication endpoints" },
          { name: "secrets", description: "Secret management endpoints" },
        ],
        components: {
          securitySchemes: {
            sessionAuth: {
              type: "apiKey",
              in: "header",
              name: "x-session-id",
              description: "Session ID obtained from login or register",
            },
          },
        },
      },
    })
  )
  // Authentication middleware
  .derive({ as: "global" }, async ({ headers, set, path }) => {
    // Skip auth check for login and register endpoints
    if (headers["x-skip-auth"] === "true" || path.startsWith("/swagger") || path.startsWith("swagger")) {
      return {};
    }

    const sessionId = headers["x-session-id"];

    if (!sessionId) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    const user = await authService.validateSession(sessionId);

    if (!user) {
      set.status = 401;
      throw new Error("Invalid or expired session");
    }

    return { userId: user.id };
  })
  // Auth routes
  .post(
    "/auth/register",
    async ({ body, set }) => {
      try {
        const { user, sessionId } = await authService.register(
          body.username,
          body.password
        );

        return {
          success: true,
          sessionId,
          userId: user.id,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: error.message,
        };
      }
    },
    {
      headers: t.Object({
        "x-skip-auth": t.Optional(t.String()),
      }),
      body: AuthRequest,
      response: AuthResponse,
      detail: {
        tags: ["authentication"],
        summary: "Register a new user",
        description:
          "Creates a new user account and returns a session ID for authentication",
      },
    }
  )
  .post(
    "/auth/login",
    async ({ body, set }) => {
      const result = await authService.login(body.username, body.password);

      if (!result) {
        set.status = 401;
        return {
          success: false,
          message: "Invalid credentials",
        };
      }

      return {
        success: true,
        sessionId: result.sessionId,
        userId: result.user.id,
      };
    },
    {
      headers: t.Object({
        "x-skip-auth": t.Optional(t.String()),
      }),
      body: AuthRequest,
      response: AuthResponse,
      detail: {
        tags: ["authentication"],
        summary: "Login to your account",
        description:
          "Authenticates user credentials and returns a session ID for further requests",
      },
    }
  )
  .post(
    "/auth/logout",
    async ({ headers }) => {
      const sessionId = headers["x-session-id"];

      if (sessionId) {
        await authService.logout(sessionId);
      }

      return {
        success: true,
        message: "Logged out successfully",
      };
    },
    {
      detail: {
        tags: ["authentication"],
        summary: "Logout from your account",
        description: "Invalidates the current session ID",
        security: [{ sessionAuth: [] }],
      },
    }
  )
  // Secret routes
  .post(
    "/secrets",
    async ({ body, userId, set }) => {
      try {
        const secret = secretService.createSecret(userId, body.key, body.value);

        return {
          success: true,
          secret: {
            id: secret.id,
            key: secret.key,
            createdAt: secret.createdAt,
          },
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: error.message,
        };
      }
    },
    {
      body: SecretRequest,
      response: SecretResponse,
      detail: {
        tags: ["secrets"],
        summary: "Create a new secret",
        description: "Stores a new secret with the provided key and value",
        security: [{ sessionAuth: [] }],
      },
    }
  )
  .get(
    "/secrets/:key",
    async ({ params, userId, set }) => {
      const secret = secretService.getSecret(userId, params.key);

      if (!secret) {
        set.status = 404;
        return {
          success: false,
          message: `Secret with key '${params.key}' not found`,
        };
      }

      return {
        success: true,
        secret: {
          key: secret.key,
          value: secret.value,
          createdAt: secret.createdAt,
        },
      };
    },
    {
      params: t.Object({
        key: t.String({
          description: "The unique key of the secret to retrieve",
        }),
      }),
      response: SecretResponse,
      detail: {
        tags: ["secrets"],
        summary: "Get a secret by key",
        description: "Retrieves a secret by its unique key",
        security: [{ sessionAuth: [] }],
      },
    }
  )
  .get(
    "/secrets",
    async ({ userId }) => {
      const secrets = secretService.listSecrets(userId);

      return {
        success: true,
        secrets: secrets.map((secret) => ({
          id: secret.id,
          key: secret.key,
          createdAt: secret.createdAt,
        })),
      };
    },
    {
      response: SecretsListResponse,
      detail: {
        tags: ["secrets"],
        summary: "List all secrets",
        description: "Returns a list of all secrets for the authenticated user",
        security: [{ sessionAuth: [] }],
      },
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia Secrets API is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger documentation available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);

export type App = typeof app;
