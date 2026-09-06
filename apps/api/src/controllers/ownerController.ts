import { Response } from 'express';
import { prisma } from '../db';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const getOwnerDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);

    const owner = await prisma.parkingOwner.findUnique({
      where: { userId: req.user.id },
      include: {
        facilities: {
          include: {
            slots: true,
            pricing: true,
          },
        },
      },
    });

    if (!owner) {
      return sendError(res, 'Parking Owner profile not found', 'NOT_FOUND', 404);
    }

    const facilityIds = owner.facilities.map((f) => f.id);

    // Bookings overview
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayBookings = await prisma.booking.findMany({
      where: {
        facilityId: { in: facilityIds },
        createdAt: { gte: todayStart },
      },
      include: { facility: true, slot: true, vehicle: true, user: true },
    });

    const todayRevenue = todayBookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const allBookings = await prisma.booking.findMany({
      where: { facilityId: { in: facilityIds } },
    });

    const totalRevenue = allBookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const totalSlots = owner.facilities.reduce((sum, f) => sum + f.slots.length, 0);
    const activeOccupiedSlots = await prisma.booking.count({
      where: {
        facilityId: { in: facilityIds },
        status: 'ACTIVE',
      },
    });

    const occupancyRate = totalSlots > 0 ? Math.round((activeOccupiedSlots / totalSlots) * 100) : 0;

    return sendSuccess(res, 'Owner dashboard statistics', {
      ownerInfo: owner,
      facilitiesCount: owner.facilities.length,
      totalSlots,
      activeOccupiedSlots,
      availableSlots: totalSlots - activeOccupiedSlots,
      occupancyRate,
      todayBookingsCount: todayBookings.length,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      recentBookings: todayBookings.slice(0, 10),
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to load owner dashboard', 'SERVER_ERROR', 500);
  }
};

export const createFacility = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);

    let owner = await prisma.parkingOwner.findUnique({
      where: { userId: req.user.id },
    });

    if (!owner) {
      owner = await prisma.parkingOwner.create({
        data: {
          userId: req.user.id,
          businessName: `${req.user.name}'s Parking`,
        },
      });
    }

    const {
      name,
      description,
      address,
      city,
      state = 'Karnataka',
      latitude,
      longitude,
      phone,
      email,
      openingTime = '06:00 AM',
      closingTime = '11:00 PM',
      is247 = true,
      rules,
      photos = [],
      amenities = [],
      hourlyRate = 40,
      dailyMaxRate = 300,
    } = req.body;

    if (!name || !address || !city || latitude === undefined || longitude === undefined) {
      return sendError(res, 'Name, address, city, latitude, and longitude are required', 'VALIDATION_ERROR', 400);
    }

    const facility = await prisma.parkingFacility.create({
      data: {
        ownerId: owner.id,
        name,
        description,
        address,
        city,
        state,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
        email,
        openingTime,
        closingTime,
        is247: Boolean(is247),
        rules,
        photos: JSON.stringify(photos),
        status: 'APPROVED', // Auto-approve for demo speed
      },
    });

    // Pricing setup
    await prisma.parkingPricing.create({
      data: {
        facilityId: facility.id,
        hourlyRate: parseFloat(hourlyRate),
        dailyMaxRate: parseFloat(dailyMaxRate),
      },
    });

    // Amenities setup
    if (Array.isArray(amenities) && amenities.length > 0) {
      for (const amenity of amenities) {
        await prisma.facilityAmenity.create({
          data: { facilityId: facility.id, amenity },
        });
      }
    }

    return sendSuccess(res, 'Parking facility created successfully', facility, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create facility', 'SERVER_ERROR', 500);
  }
};

export const bulkGenerateSlots = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { facilityId } = req.params;
    const { prefix = 'A', count = 20, floor = 'G', vehicleType = 'FOUR_WHEELER', category = 'REGULAR', priceModifier = 0 } = req.body;

    const facility = await prisma.parkingFacility.findUnique({ where: { id: facilityId } });
    if (!facility) return sendError(res, 'Facility not found', 'NOT_FOUND', 404);

    const generatedSlots = [];
    for (let i = 1; i <= count; i++) {
      const slotNum = `${prefix}${i < 10 ? '0' + i : i}`;
      try {
        const slot = await prisma.parkingSlot.create({
          data: {
            facilityId,
            slotNumber: slotNum,
            floor,
            section: prefix,
            vehicleType,
            category,
            priceModifier: parseFloat(priceModifier),
            status: 'AVAILABLE',
          },
        });
        generatedSlots.push(slot);
      } catch (e) {
        // Skip duplicate slot numbers
      }
    }

    // Update facility slot total count
    const totalCount = await prisma.parkingSlot.count({ where: { facilityId } });
    await prisma.parkingFacility.update({
      where: { id: facilityId },
      data: { totalSlots: totalCount },
    });

    return sendSuccess(res, `Successfully generated ${generatedSlots.length} slots`, {
      slotsCount: generatedSlots.length,
      totalSlots: totalCount,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to generate slots', 'SERVER_ERROR', 500);
  }
};
