import { SlotAvailabilitySummary, SlotStatus } from '@parkease/shared';
import { prisma } from '../db';
import crypto from 'crypto';

export interface CheckOverlapParams {
  slotId: string;
  startTime: Date;
  endTime: Date;
  excludeBookingId?: string;
}

export const isSlotOverlapping = async (params: CheckOverlapParams): Promise<boolean> => {
  const { slotId, startTime, endTime, excludeBookingId } = params;

  // Cleanup expired slot holds first
  await cleanupExpiredHolds();

  // 1. Check existing confirmed/active bookings for overlapping time windows
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      slotId,
      status: { in: ['CONFIRMED', 'UPCOMING', 'ACTIVE', 'PAYMENT_PENDING'] },
      NOT: [
        { endTime: { lte: startTime } },
        { startTime: { gte: endTime } },
      ],
      ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
    },
  });

  if (overlappingBookings.length > 0) {
    return true;
  }

  // 2. Check active slot holds (temporary 10-minute hold lock)
  const activeHolds = await prisma.slotHold.findMany({
    where: {
      slotId,
      expiresAt: { gt: new Date() },
    },
  });

  return activeHolds.length > 0;
};

export const holdSlotForUser = async (
  slotId: string,
  userId: string,
  startTime: Date,
  endTime: Date,
  holdDurationMinutes: number = 10
): Promise<{ holdToken: string; expiresAt: Date }> => {
  // Concurrency check before holding
  const hasOverlap = await isSlotOverlapping({ slotId, startTime, endTime });
  if (hasOverlap) {
    throw new Error('This parking slot is no longer available for the selected time window.');
  }

  // Clean up any existing holds for this user on this slot
  await prisma.slotHold.deleteMany({
    where: { slotId, userId },
  });

  const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);
  const holdToken = `HOLD_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  await prisma.slotHold.create({
    data: {
      slotId,
      userId,
      holdToken,
      expiresAt,
    },
  });

  return { holdToken, expiresAt };
};

export const releaseHold = async (holdToken: string) => {
  await prisma.slotHold.deleteMany({
    where: { holdToken },
  });
};

export const cleanupExpiredHolds = async () => {
  await prisma.slotHold.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
};

export const getFacilitySlotStatusMap = async (
  facilityId: string,
  startTime?: Date,
  endTime?: Date
) => {
  const reqStart = startTime || new Date();
  const reqEnd = endTime || new Date(Date.now() + 2 * 60 * 60 * 1000);

  await cleanupExpiredHolds();

  const slots = await prisma.parkingSlot.findMany({
    where: { facilityId },
    orderBy: [{ floor: 'asc' }, { slotNumber: 'asc' }],
  });

  // Find all active bookings in this time window
  const activeBookings = await prisma.booking.findMany({
    where: {
      facilityId,
      status: { in: ['CONFIRMED', 'UPCOMING', 'ACTIVE', 'PAYMENT_PENDING'] },
      NOT: [
        { endTime: { lte: reqStart } },
        { startTime: { gte: reqEnd } },
      ],
    },
  });

  const activeHolds = await prisma.slotHold.findMany({
    where: {
      slot: { facilityId },
      expiresAt: { gt: new Date() },
    },
  });

  const bookedSlotIds = new Set(activeBookings.map((b) => b.slotId));
  const heldSlotIds = new Set(activeHolds.map((h) => h.slotId));

  const slotsWithCalculatedStatus = slots.map((slot) => {
    let computedStatus = slot.status;

    if (slot.status === 'AVAILABLE') {
      if (bookedSlotIds.has(slot.id)) {
        computedStatus = 'RESERVED';
      } else if (heldSlotIds.has(slot.id)) {
        computedStatus = 'HELD';
      }
    }

    return {
      ...slot,
      computedStatus,
    };
  });

  const summary: SlotAvailabilitySummary = {
    totalSlots: slots.length,
    availableSlots: slotsWithCalculatedStatus.filter((s) => s.computedStatus === 'AVAILABLE').length,
    occupiedSlots: slotsWithCalculatedStatus.filter((s) => s.computedStatus === 'OCCUPIED').length,
    reservedSlots: slotsWithCalculatedStatus.filter((s) => s.computedStatus === 'RESERVED').length,
    heldSlots: slotsWithCalculatedStatus.filter((s) => s.computedStatus === 'HELD').length,
    maintenanceSlots: slotsWithCalculatedStatus.filter((s) => s.computedStatus === 'MAINTENANCE').length,
    blockedSlots: slotsWithCalculatedStatus.filter((s) => s.computedStatus === 'BLOCKED').length,
  };

  return {
    slots: slotsWithCalculatedStatus,
    summary,
  };
};
