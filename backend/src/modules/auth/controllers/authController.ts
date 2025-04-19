import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

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