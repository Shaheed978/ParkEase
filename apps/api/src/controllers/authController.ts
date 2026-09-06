import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'parkease_super_secret_jwt_key_2026_change_in_production';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 'VALIDATION_ERROR', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long', 'VALIDATION_ERROR', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return sendError(res, 'This email address is already registered. Please log in.', 'EMAIL_EXISTS', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = (role === 'OWNER' || role === 'ADMIN') ? role : 'CUSTOMER';

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          role: userRole,
          phone: phone ? phone.trim() : null,
          isVerified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (userRole === 'OWNER') {
        await tx.parkingOwner.create({
          data: {
            userId: newUser.id,
            businessName: `${newUser.name}'s Parking Solutions`,
            isVerified: true,
          },
        });
      }

      return newUser;
    });

    const token = jwt.sign(
      { id: result.id, email: result.email, role: result.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess(res, 'Registration successful', { user: result, token }, 201);
  } catch (error: any) {
    console.error('Registration Error:', error);
    return sendError(res, error.message || 'Registration failed', 'SERVER_ERROR', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 'VALIDATION_ERROR', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password credentials', 'INVALID_CREDENTIALS', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password credentials', 'INVALID_CREDENTIALS', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    };

    return sendSuccess(res, 'Login successful', { user: userPayload, token });
  } catch (error: any) {
    return sendError(res, error.message || 'Login failed', 'SERVER_ERROR', 500);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        vehicles: true,
        parkingOwner: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, 'User profile fetched', user);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch user', 'SERVER_ERROR', 500);
  }
};
