import request from 'supertest';
import express from 'express';
import { register, login } from '../../modules/auth/controllers/authController';
import { PrismaClient } from '../../generated/test/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.post('/auth/register', register);
app.post('/auth/login', login);

describe('Auth Controller', () => {
  const testUser = { username: 'testuser1', password: 'password123' };

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

      const dbUser = await prisma.user.findUnique({
        where: { username: testUser.username }
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser?.username).toBe(testUser.username);
    });

    it('should not register with missing fields', async () => {
      const res = await request(app).post('/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/required/i);
    });

    it('should not register with invalid username format', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ ...testUser, username: 'u' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not register with weak password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ ...testUser, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not allow duplicate usernames', async () => {
      await request(app).post('/auth/register').send(testUser);
      const res = await request(app).post('/auth/register').send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('should hash the password before storing', async () => {
      await request(app).post('/auth/register').send(testUser);
      
      const dbUser = await prisma.user.findUnique({
        where: { username: testUser.username }
      });
      
      expect(dbUser?.password).not.toBe(testUser.password);
      expect(dbUser?.password).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should return a valid JWT token', async () => {
      const res = await request(app).post('/auth/register').send(testUser);
      
      const token = res.body.data.token;
      expect(token).toBeDefined();
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      expect(decoded).toBeTruthy();
      expect(typeof decoded).toBe('object');
      if (typeof decoded === 'object') {
        expect(decoded.id).toBeDefined();
      }
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
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

    it('should not log in non-existent user', async () => {
      const res = await request(app).post('/auth/login').send({
        username: 'nonexistentuser',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid/i);
    });

    it('should return same token format as register', async () => {
      const loginRes = await request(app).post('/auth/login').send(testUser);
      
      const token = loginRes.body.data.token;
      expect(token).toBeDefined();
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      expect(decoded).toBeTruthy();
      expect(typeof decoded).toBe('object');
      if (typeof decoded === 'object') {
        expect(decoded.id).toBeDefined();
      }
    });

    it('should handle case-sensitive usernames', async () => {
      const res = await request(app).post('/auth/login').send({
        ...testUser,
        username: testUser.username.toUpperCase(),
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Auth Token Validation', () => {
    let validToken: string;

    beforeEach(async () => {
      const res = await request(app).post('/auth/register').send(testUser);
      validToken = res.body.data.token;
    });

    it('should maintain consistent user ID between register and login', async () => {
      const loginRes = await request(app).post('/auth/login').send(testUser);
      const loginToken = loginRes.body.data.token;

      const decodedRegisterToken = jwt.verify(validToken, process.env.JWT_SECRET || 'your-secret-key');
      const decodedLoginToken = jwt.verify(loginToken, process.env.JWT_SECRET || 'your-secret-key');

      if (typeof decodedRegisterToken === 'object' && typeof decodedLoginToken === 'object') {
        expect(decodedRegisterToken.id).toBe(decodedLoginToken.id);
      }
    });
  });
});