import {UserService} from './user.service';
import type {LoginInput, AuthResponse, User} from '../types';
import * as bcrypt from 'bcryptjs';

export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userService.getUserByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.userService.verifyPassword(user, input.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    
    const {password, ...userWithoutPassword} = user;
    
    return {
      token,
      user: userWithoutPassword,
    };
  }

  async register(input: {email: string; name: string; password: string}): Promise<AuthResponse> {
    const user = await this.userService.createUser(input);
    const token = this.generateToken(user);
    
    const {password, ...userWithoutPassword} = user;
    
    return {
      token,
      user: userWithoutPassword,
    };
  }

  private generateToken(user: User): string {
    // This is a placeholder - in production you'd use JWT
    // For now, we'll use a simple token format
    const payload = {
      id: user.id,
      email: user.email,
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      if (!payload.id) {
        return null;
      }
      
      const user = await this.userService.getUserById(payload.id);
      
      return user;
    } catch (error) {
      return null;
    }
  }
}