import type { User } from "../../models/user";

export interface UserRepository {
  findByUsername(username: string): User | undefined; //TODO refactor using Optional
  findById(id: string): User | undefined;
  create(username: string, password: string): User;
}
