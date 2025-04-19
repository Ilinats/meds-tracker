import { AuthService } from '../../modules/auth/services/authService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  })),
}));

describe('AuthService', () => {
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const mockUser = {
        id: '1',
        username: 'testuser',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        pushToken: null
      };
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await AuthService.registerUser('testuser', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('testuser');
      expect(typeof result.token).toBe('string');
    });

    it('should throw error for existing username', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: '1',
        username: 'testuser',
        password: 'hashedpassword'
      });

      await expect(
        AuthService.registerUser('testuser', 'password123')
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('loginUser', () => {
    it('should successfully login with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        pushToken: null
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await AuthService.loginUser('testuser', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('testuser');
      expect(typeof result.token).toBe('string');
    });

    it('should throw error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        AuthService.loginUser('nonexistent', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('rightpassword', 10);
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        pushToken: null
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(
        AuthService.loginUser('testuser', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});