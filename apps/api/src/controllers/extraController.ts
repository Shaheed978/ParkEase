import { Response } from 'express';
import { prisma } from '../db';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';

// Reviews
export const addReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { bookingId, rating, cleanlinessRating, safetyRating, serviceRating, reviewText } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: req.user.id },
    });

    if (!booking) return sendError(res, 'Booking not found', 'NOT_FOUND', 404);

    const review = await prisma.review.create({
      data: {
        bookingId,
        facilityId: booking.facilityId,
        userId: req.user.id,
        rating: parseFloat(rating || 5),
        cleanlinessRating: cleanlinessRating ? parseFloat(cleanlinessRating) : 5,
        safetyRating: safetyRating ? parseFloat(safetyRating) : 5,
        serviceRating: serviceRating ? parseFloat(serviceRating) : 5,
        reviewText,
      },
    });

    // Update facility rating
    const facilityReviews = await prisma.review.findMany({
      where: { facilityId: booking.facilityId },
    });
    const avgRating = facilityReviews.reduce((acc, curr) => acc + curr.rating, 0) / facilityReviews.length;

    await prisma.parkingFacility.update({
      where: { id: booking.facilityId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: facilityReviews.length,
      },
    });

    return sendSuccess(res, 'Review submitted successfully', review, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to submit review', 'SERVER_ERROR', 500);
  }
};

// Favorites
export const toggleFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { facilityId } = req.body;

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_facilityId: { userId: req.user.id, facilityId },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return sendSuccess(res, 'Removed from favorites', { isFavorite: false });
    } else {
      await prisma.favorite.create({
        data: { userId: req.user.id, facilityId },
      });
      return sendSuccess(res, 'Added to favorites', { isFavorite: true });
    }
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update favorite', 'SERVER_ERROR', 500);
  }
};

export const getFavorites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        facility: {
          include: { pricing: true },
        },
      },
    });

    return sendSuccess(res, 'Favorites list', favorites);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch favorites', 'SERVER_ERROR', 500);
  }
};

// Notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return sendSuccess(res, 'Notifications retrieved', { notifications, unreadCount });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch notifications', 'SERVER_ERROR', 500);
  }
};

export const markNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);

    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    return sendSuccess(res, 'All notifications marked as read');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update notifications', 'SERVER_ERROR', 500);
  }
};

// Support Tickets
export const createTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { subject, category, description, bookingId } = req.body;

    const ticketCode = `TKT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketCode,
        userId: req.user.id,
        bookingId: bookingId || null,
        category: category || 'GENERAL',
        subject,
        description,
      },
    });

    return sendSuccess(res, 'Support ticket submitted', ticket, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create support ticket', 'SERVER_ERROR', 500);
  }
};
