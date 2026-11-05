import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'studiospace_production_jwt_secret_key_2026_super_secure';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    photoURL?: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check HTTPOnly cookie first (Challenge 1) or Authorization Header fallback
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authentication token is missing or expired in HTTPOnly cookie.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId || decoded._id,
      email: decoded.email,
      name: decoded.name,
      photoURL: decoded.photoURL,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid or expired authentication token.',
    });
  }
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId || decoded._id,
      email: decoded.email,
      name: decoded.name,
      photoURL: decoded.photoURL,
    };
  } catch (error) {
    // Ignore invalid optional token
  }
  next();
};
