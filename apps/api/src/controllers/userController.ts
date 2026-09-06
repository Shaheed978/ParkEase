import { Response } from 'express';
import { prisma } from '../db';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { name, phone, avatar } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
    });

    return sendSuccess(res, 'Profile updated successfully', updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update profile', 'SERVER_ERROR', 500);
  }
};

export const getVehicles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' },
    });

    return sendSuccess(res, 'Vehicles retrieved', vehicles);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch vehicles', 'SERVER_ERROR', 500);
  }
};

export const addVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { vehicleNumber, vehicleType, brand, model, color, isEv, isDefault } = req.body;

    if (!vehicleNumber) {
      return sendError(res, 'Vehicle registration number is required', 'VALIDATION_ERROR', 400);
    }

    if (isDefault) {
      await prisma.vehicle.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user.id,
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        vehicleType: vehicleType || 'FOUR_WHEELER',
        brand: brand || null,
        model: model || null,
        color: color || null,
        isEv: Boolean(isEv),
        isDefault: Boolean(isDefault),
      },
    });

    return sendSuccess(res, 'Vehicle added successfully', vehicle, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to add vehicle', 'SERVER_ERROR', 500);
  }
};

export const deleteVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!vehicle) {
      return sendError(res, 'Vehicle not found or unauthorized', 'NOT_FOUND', 404);
    }

    await prisma.vehicle.delete({ where: { id } });
    return sendSuccess(res, 'Vehicle deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete vehicle', 'SERVER_ERROR', 500);
  }
};
