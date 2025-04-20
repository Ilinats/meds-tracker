import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../../../shared/types/express.types';
import { PrismaClient, MedicineUnit } from '../../../../prisma/app/generated/prisma/client';


const prisma = new PrismaClient();

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

    const { user, token } = await AuthService.registerUser(username, password);

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
    res.status(400).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unable to register user'
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

    const { user, token } = await AuthService.loginUser(username, password);

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
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials'
      }
    });
  }
};

export const updatePushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { pushToken } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
      return;
    }

    if (!pushToken) {
      res.status(400).json({
        success: false,
        error: { message: 'Push token is required' }
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { pushToken }
    });

    res.status(200).json({
      success: true,
      data: { pushToken: user.pushToken }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Unable to update push token' }
    });
  }
};