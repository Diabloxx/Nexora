import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.globalRole !== 'staff' && req.user.globalRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Staff access required'
    });
  }

  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.globalRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Admins and owners have all permissions
    if (req.user.globalRole === 'admin' || req.user.globalRole === 'owner') {
      return next();
    }

    // Check if user has the specific permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Permission required: ${permission}`
      });
    }

    next();
  };
};

// Permission constants
export const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ANNOUNCEMENTS: 'MANAGE_ANNOUNCEMENTS',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  MANAGE_SERVERS: 'MANAGE_SERVERS',
  MODERATE_CONTENT: 'MODERATE_CONTENT'
} as const;
