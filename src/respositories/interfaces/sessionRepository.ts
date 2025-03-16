import type { Session } from "../../models/session";

export interface SessionRepository {
  create(userId: string): Session;
  findById(sessionId: string): Session | undefined;
  removeById(sessionId: string): void;
  removeExpiredSessions(): void;
}
