import type {User as DbUser, Link as DbLink} from './db/schema';

export type User = DbUser;
export type Link = DbLink;

export interface CreateLinkInput {
  url: string;
  title: string;
  description?: string;
}

export interface UpdateLinkInput {
  url?: string;
  title?: string;
  description?: string;
}

export interface LinkRepository {
  create(input: CreateLinkInput, userId: string): Promise<Link>;
  findById(id: string): Promise<Link | null>;
  findAllByUser(userId: string): Promise<Link[]>;
  findAll(): Promise<Link[]>;
  update(id: string, input: UpdateLinkInput): Promise<Link | null>;
  delete(id: string): Promise<boolean>;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  setResetToken(email: string, token: string, expiry: Date): Promise<boolean>;
  findByResetToken(token: string): Promise<User | null>;
  clearResetToken(id: string): Promise<boolean>;
}