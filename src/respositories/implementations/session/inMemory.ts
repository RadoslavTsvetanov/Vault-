import { randomUUID } from "crypto";
import type { SessionRepository } from "../../interfaces/sessionRepository";
import type { Session } from "../../../models/session";

export class InMemorySessionRepository implements SessionRepository {
  private sessions: Session[] = [];
  private readonly SESSION_EXPIRY_HOURS = 24;

  create(userId: string): Session {
    // Clean up expired sessions
    this.removeExpiredSessions();

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(now.getHours() + this.SESSION_EXPIRY_HOURS);

    const session: Session = {
      id: randomUUID(),
      userId,
      createdAt: now,
      expiresAt,
    };

    this.sessions.push(session);
    return session;
  }

  findById(sessionId: string): Session | undefined {
    const session = this.sessions.find((s) => s.id === sessionId);

    if (!session) {
      return undefined;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      this.removeById(sessionId);
      return undefined;
    }

    return session;
  }

  removeById(sessionId: string): void {
    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
  }

  removeExpiredSessions(): void {
    const now = new Date();
    this.sessions = this.sessions.filter((session) => session.expiresAt > now);
  }
}
