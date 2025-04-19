import { Request, Response } from 'express';
import { register, login } from '../../modules/auth/controllers/authController';
import { AuthService } from '../../modules/auth/services/authService';

jest.mock('../../modules/auth/services/authService', () => ({
  AuthService: {
    registerUser: jest.fn(),
    loginUser: jest.fn(),
  },
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockUser = {
    id: '1',
    username: 'testuser',
    password: 'hashedpassword',
  };
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };

      (AuthService.registerUser as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            username: mockUser.username,
          },
          token: mockToken,
        },
      });
    });

    it('should return 400 if username or password is missing', async () => {
      mockRequest.body = {
        username: 'testuser',
        // password missing
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Username and password are required',
        },
      });
    });

    it('should return 400 if registration fails', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };

      (AuthService.registerUser as jest.Mock).mockRejectedValueOnce(
        new Error('Username already exists')
      );

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Username already exists',
        },
      });
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };

      (AuthService.loginUser as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
      });

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            username: mockUser.username,
          },
          token: mockToken,
        },
      });
    });

    it('should return 400 if username or password is missing', async () => {
      mockRequest.body = {
        username: 'testuser',
        // password missing
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Username and password are required',
        },
      });
    });

    it('should return 401 if login fails', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      (AuthService.loginUser as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid credentials',
        },
      });
    });
  });
});