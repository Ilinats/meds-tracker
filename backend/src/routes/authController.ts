import { Request, Response } from 'express';
import { PrismaClient } from '../../prisma/app/generated/prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'taen-kluch';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({
        success: false,
        error: {
          message: 'Username and password are required'
        }
      });
      return;
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });

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

    if (!username || !password) {
        res.status(400).json({
        success: false,
        error: {
          message: 'Username and password are required'
        }
      });
      return;
    }

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

export const updatePushToken = async (req: AuthRequest, res: Response) => {
    try {
      const { pushToken } = req.body;
      
      if (!pushToken) {
          res.status(400).json({
          success: false,
          error: {
            message: 'Push token is required'
          }
        });
        return;
      }
  
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { pushToken }
      });
  
      res.json({
        success: true,
        message: 'Push token updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Unable to update push token'
        }
      });
    }
  };