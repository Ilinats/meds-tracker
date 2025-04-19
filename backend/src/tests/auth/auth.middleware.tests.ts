import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/express.types';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      header: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should successfully authenticate with valid token', async () => {
    const mockToken = 'valid-token';
    const mockUserId = '123';
    
    (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
    (jwt.verify as jest.Mock).mockReturnValue({ id: mockUserId });

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
    expect(mockRequest.user).toEqual({ id: mockUserId });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 if no token is provided', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Please authenticate',
      },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue('Bearer invalid-token');
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Please authenticate',
      },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle malformed Bearer token', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue('InvalidBearerFormat');

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Please authenticate',
      },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle empty Bearer token', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue('Bearer ');

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Please authenticate',
      },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});