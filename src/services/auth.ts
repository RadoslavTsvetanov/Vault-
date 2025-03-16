import type { User } from "../models/user";
import type { SessionRepository } from "../respositories/interfaces/sessionRepository";
import type { UserRepository } from "../respositories/interfaces/user";

interface IAuthService {
  login(
    username: string,
    password: string
  ): Promise<{ user: User; sessionId: string } | null>;
  register(
    username: string,
    password: string
  ): Promise<{ user: User; sessionId: string }>;
  validateSession(sessionId: string): Promise<User | null>;
  logout(sessionId: string): Promise<void>;
}

export class AuthService implements IAuthService {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository
  ) {}

  async login(
    username: string,
    password: string
  ): Promise<{ user: User; sessionId: string } | null> {
    const user = this.userRepository.findByUsername(username);

    if (!user || user.password !== password) {
      return null;
    }

    const session = this.sessionRepository.create(user.id);
    return { user, sessionId: session.id };
  }

  async register(
    username: string,
    password: string
  ): Promise<{ user: User; sessionId: string }> {
    const existingUser = this.userRepository.findByUsername(username);

    if (existingUser) {
      throw new Error("Username already exists");
    }

    const user = this.userRepository.create(username, password);
    const session = this.sessionRepository.create(user.id);

    return { user, sessionId: session.id };
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = this.sessionRepository.findById(sessionId);

    if (!session) {
      return null;
    }

    const user = this.userRepository.findById(session.userId);
    return user || null;
  }

  async logout(sessionId: string): Promise<void> {
    this.sessionRepository.removeById(sessionId);
  }
}
