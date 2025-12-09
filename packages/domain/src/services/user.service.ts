import {resolveDependency} from '@stashl/iocdi';
import {REPOSITORY_SYMBOLS} from '../repositories';
import type {UserRepository, User, CreateUserInput, UpdateUserInput} from '../types';
import * as bcrypt from 'bcryptjs';

export class UserService {
  private repository: UserRepository;

  constructor() {
    const repo = resolveDependency<UserRepository>(REPOSITORY_SYMBOLS.USER_REPOSITORY);
    if (!repo) {
      throw new Error('UserRepository not initialized. Call initializeRepositories() first.');
    }
    this.repository = repo;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    if (!input.email.trim()) {
      throw new Error('Email cannot be empty');
    }

    if (!input.name.trim()) {
      throw new Error('Name cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new Error('Invalid email format');
    }

    const existingUser = await this.repository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    
    return await this.repository.create({
      ...input,
      password: hashedPassword,
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.repository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.repository.findByEmail(email);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.repository.findAll();
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (input.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        throw new Error('Invalid email format');
      }

      const existingUser = await this.repository.findByEmail(input.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already in use');
      }
    }

    const updateData = {...input};
    if (input.password) {
      updateData.password = await bcrypt.hash(input.password, 10);
    }

    return await this.repository.update(id, updateData);
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return await this.repository.delete(id);
  }

  async setPasswordResetToken(email: string): Promise<string> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.repository.setResetToken(email, token, expiry);
    return token;
  }

  async validateResetToken(token: string): Promise<User | null> {
    const user = await this.repository.findByResetToken(token);
    if (!user) {
      return null;
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return null;
    }

    return user;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.validateResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.repository.update(user.id, {password: hashedPassword});
    await this.repository.clearResetToken(user.id);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }
}