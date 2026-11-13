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

function extractToken(req: Request): string | null {
  // Check HTTPOnly cookie first, or Authorization Bearer header
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.substring(7).trim();
    }
    return authHeader;
  }
  return null;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authentication token is missing or expired in HTTPOnly cookie or Authorization header.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId || decoded._id || decoded.id,
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
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId || decoded._id || decoded.id,
      email: decoded.email,
      name: decoded.name,
      photoURL: decoded.photoURL,
    };
  } catch (error) {
    // Ignore invalid optional token
  }
  next();
};
