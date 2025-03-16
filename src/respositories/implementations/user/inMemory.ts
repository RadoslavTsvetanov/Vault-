import { randomUUID } from "crypto";
import type { UserRepository } from "../../interfaces/user";
import type { User } from "../../../models/user";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  findByUsername(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }

  findById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  create(username: string, password: string): User {
    const user: User = {
      id: randomUUID(),
      username,
      password,
    };
    this.users.push(user);
    return user;
  }
}
