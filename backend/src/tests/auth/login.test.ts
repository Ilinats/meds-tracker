// import { PrismaClient } from '../../generated/test/client';
// import { AuthService } from '../../modules/auth/services/authService';

// const prisma = new PrismaClient();

// describe('User Login', () => {
//   beforeAll(async () => {
//     await prisma.user.deleteMany();
//   });

//   afterEach(async () => {
//     await prisma.user.deleteMany();
//   });

//   afterAll(async () => {
//     await prisma.$disconnect();
//   });

//   describe('Basic Login', () => {
//     beforeEach(async () => {
//       await AuthService.registerUser('testuser', 'Password123!');
//     });

//     it('should successfully login with correct credentials', async () => {
//       const result = await AuthService.loginUser('testuser', 'Password123!');

//       expect(result).toHaveProperty('token');
//       expect(result).toHaveProperty('user');
//       expect(result.user.username).toBe('testuser');
//     });

//     it('should not login with incorrect password', async () => {
//       await expect(
//         AuthService.loginUser('testuser', 'WrongPassword123!')
//       ).rejects.toThrow('Invalid credentials');
//     });

//     it('should not login with non-existent username', async () => {
//       await expect(
//         AuthService.loginUser('nonexistent', 'Password123!')
//       ).rejects.toThrow('Invalid credentials');
//     });
//   });

//   describe('Login Attempts', () => {
//     beforeEach(async () => {
//       await AuthService.registerUser('testuser', 'Password123!');
//     });

//     it('should allow multiple successful logins', async () => {
//       await AuthService.loginUser('testuser', 'Password123!');
//       await AuthService.loginUser('testuser', 'Password123!');
//       await AuthService.loginUser('testuser', 'Password123!');

//       const result = await AuthService.loginUser('testuser', 'Password123!');
//       expect(result).toHaveProperty('token');
//     });

//     it('should handle case-sensitive usernames', async () => {
//       await expect(
//         AuthService.loginUser('TestUser', 'Password123!')
//       ).rejects.toThrow('Invalid credentials');
//     });
//   });
// });

// tests/authController.test.ts

import request from 'supertest';
import express from 'express';
import { register, login } from '../../modules/auth/controllers/authController';
import { PrismaClient } from '../../generated/test/client';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.post('/auth/register', register);
app.post('/auth/login', login);

describe('Auth Controller', () => {
  const testUser = { username: 'testuser', password: 'password123' };

  // Cleanup: clear users before each test
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.token).toBeDefined();
    });

    it('should not register with missing fields', async () => {
      const res = await request(app).post('/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/required/i);
    });

    it('should not allow duplicate usernames', async () => {
      await request(app).post('/auth/register').send(testUser);
      const res = await request(app).post('/auth/register').send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register user before login tests
      await request(app).post('/auth/register').send(testUser);
    });

    it('should log in an existing user', async () => {
      const res = await request(app).post('/auth/login').send(testUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.token).toBeDefined();
    });

    it('should not log in with incorrect password', async () => {
      const res = await request(app).post('/auth/login').send({
        username: testUser.username,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid/i);
    });

    it('should not log in with missing fields', async () => {
      const res = await request(app).post('/auth/login').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/required/i);
    });
  });
});
