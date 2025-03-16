import { edenTreaty } from "@elysiajs/eden";
import type { App } from ".";
export const createClient = (baseUrl: string = "http://localhost:3000") => {
  const client = edenTreaty<App>(baseUrl);
  return client;
};


async function example() {
  const client = createClient();

  // Register a new user
  const registerResponse = await client.auth.register.post({
    username: "testuser",
    password: "password123",
  });

  if (!registerResponse.data.success) {
    console.error("Registration failed:", registerResponse.data.message);
    return;
  }

  const { sessionId } = registerResponse.data;
  console.log("Registered and logged in with session ID:", sessionId);

  // Create a secret using the session ID
  const createSecretResponse = await client.secrets.post({
    $headers: {
      "x-session-id": sessionId,
    },
    key: "api-key",
    value: "secret-value-123",
  });

  if (createSecretResponse.data.success) {
    console.log("Secret created:", createSecretResponse.data.secret);
  }

  // Get all secrets
  const secretsResponse = await client.secrets.get({
    $headers: {
      "x-session-id": sessionId,
    },
  });

  if (secretsResponse.data.success) {
    console.log("All secrets:", secretsResponse.data.secrets);
  }

  // Get a specific secret
  const specificSecretResponse = await client.secrets["api-key"].get({
    $headers: {
      "x-session-id": sessionId,
    },
  });

  if (specificSecretResponse.data.success) {
    console.log("Specific secret:", specificSecretResponse.data.secret);
  }

  // Logout
  const logoutResponse = await client.auth.logout.post({
    $headers: {
      "x-session-id": sessionId,
    },
  });

  if (logoutResponse.data.success) {
    console.log("Logged out successfully");
  }
}