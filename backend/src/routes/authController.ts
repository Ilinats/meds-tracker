// src/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '../../prisma/app/generated/prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'taen-kluch';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        res.status(400).json({
        success: false,
        error: {
          message: 'Username and password are required'
        }
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
        res.status(400).json({
        success: false,
        error: {
          message: 'Username already exists'
        }
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Unable to register user'
      }
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        res.status(400).json({
        success: false,
        error: {
          message: 'Username and password are required'
        }
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
        res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials'
        }
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials'
        }
      });
      return;
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Unable to login'
      }
    });
  }
};