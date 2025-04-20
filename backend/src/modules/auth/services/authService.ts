import { PrismaClient } from '../../../../prisma/app/generated/prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
  private static validateUsername(username: string) {
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  private static validatePassword(password: string) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    if (!hasNumber || !hasLetter) {
      throw new Error('Password must contain at least one letter and one number');
    }
  }

  static async registerUser(username: string, password: string) {
    this.validateUsername(username);
    this.validatePassword(password);

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    
    return { user, token };
  }

  static async loginUser(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    
    return { user, token };
  }
}