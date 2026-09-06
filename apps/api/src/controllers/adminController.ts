import { Response } from 'express';
import { prisma } from '../db';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalOwners = await prisma.user.count({ where: { role: 'OWNER' } });
    const totalFacilities = await prisma.parkingFacility.count();
    const activeFacilities = await prisma.parkingFacility.count({ where: { status: 'APPROVED' } });
    const pendingFacilities = await prisma.parkingFacility.count({ where: { status: 'PENDING' } });
    const totalSlots = await prisma.parkingSlot.count();
    const occupiedSlots = await prisma.booking.count({ where: { status: 'ACTIVE' } });

    const totalBookings = await prisma.booking.count();

    // Financial calculations
    const successfulBookings = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] } },
      select: { totalAmount: true, platformFee: true, taxAmount: true },
    });

    const gmv = successfulBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const platformCommission = successfulBookings.reduce((sum, b) => sum + b.platformFee, 0);

    const couponsCount = await prisma.coupon.count();

    return sendSuccess(res, 'Admin dashboard stats retrieved', {
      totalUsers,
      totalOwners,
      totalFacilities,
      activeFacilities,
      pendingFacilities,
      totalSlots,
      occupiedSlots,
      availableSlots: totalSlots - occupiedSlots,
      totalBookings,
      gmv: Math.round(gmv * 100) / 100,
      platformCommission: Math.round(platformCommission * 100) / 100,
      couponsCount,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch admin stats', 'SERVER_ERROR', 500);
  }
};

export const getPendingFacilities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const facilities = await prisma.parkingFacility.findMany({
      where: { status: 'PENDING' },
      include: { owner: { include: { user: true } } },
    });
    return sendSuccess(res, 'Pending facilities retrieved', facilities);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch pending facilities', 'SERVER_ERROR', 500);
  }
};

export const updateFacilityStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED, SUSPENDED

    if (!status || !['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return sendError(res, 'Valid status is required', 'VALIDATION_ERROR', 400);
    }

    const facility = await prisma.parkingFacility.update({
      where: { id },
      data: { status },
    });

    return sendSuccess(res, `Facility status updated to ${status}`, facility);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update status', 'SERVER_ERROR', 500);
  }
};

export const getCoupons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return sendSuccess(res, 'Coupons list', coupons);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch coupons', 'SERVER_ERROR', 500);
  }
};

export const createCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountPercent, fixedDiscount, maxDiscount, minOrder, endDate } = req.body;

    if (!code || (!discountPercent && !fixedDiscount)) {
      return sendError(res, 'Coupon code and discount amount or percent required', 'VALIDATION_ERROR', 400);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        fixedDiscount: fixedDiscount ? parseFloat(fixedDiscount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        minOrder: minOrder ? parseFloat(minOrder) : 0,
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    return sendSuccess(res, 'Coupon created successfully', coupon, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create coupon', 'SERVER_ERROR', 500);
  }
};
