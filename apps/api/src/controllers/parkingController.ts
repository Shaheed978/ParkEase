import { Request, Response } from 'express';
import { prisma } from '../db';
import { sendError, sendSuccess } from '../utils/response';
import { getFacilitySlotStatusMap } from '../services/availabilityEngine';
import { AuthenticatedRequest } from '../middleware/auth';

// Haversine formula to compute distance between two geo coordinates in KM
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const searchParking = async (req: Request, res: Response) => {
  try {
    const {
      latitude,
      longitude,
      radius = '10',
      query,
      vehicleType,
      minPrice,
      maxPrice,
      rating,
      amenities,
      sortBy = 'nearest',
      startTime,
      endTime,
    } = req.query as Record<string, string>;

    const searchLat = latitude ? parseFloat(latitude) : 12.9716; // Default to Bengaluru city center
    const searchLng = longitude ? parseFloat(longitude) : 77.5946;
    const maxRadius = parseFloat(radius);

    let whereClause: any = {
      status: 'APPROVED',
    };

    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      whereClause.OR = [
        { name: { contains: q } },
        { address: { contains: q } },
        { city: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (rating) {
      whereClause.rating = { gte: parseFloat(rating) };
    }

    const facilities = await prisma.parkingFacility.findMany({
      where: whereClause,
      include: {
        pricing: true,
        amenities: true,
        _count: {
          select: { slots: true, reviews: true },
        },
      },
    });

    const reqStart = startTime ? new Date(startTime) : new Date();
    const reqEnd = endTime ? new Date(endTime) : new Date(Date.now() + 3 * 60 * 60 * 1000);

    // Compute distance and availability for each facility
    const results = await Promise.all(
      facilities.map(async (fac) => {
        const distance = calculateDistanceKm(searchLat, searchLng, fac.latitude, fac.longitude);

        // Fetch live slot availability using availability engine
        const { summary } = await getFacilitySlotStatusMap(fac.id, reqStart, reqEnd);

        // Photos parser
        let parsedPhotos: string[] = [];
        try {
          parsedPhotos = JSON.parse(fac.photos || '[]');
        } catch (e) {
          parsedPhotos = [];
        }

        const amenityList = fac.amenities.map((a) => a.amenity);

        return {
          id: fac.id,
          name: fac.name,
          description: fac.description,
          address: fac.address,
          city: fac.city,
          state: fac.state,
          latitude: fac.latitude,
          longitude: fac.longitude,
          distance,
          rating: fac.rating,
          reviewCount: fac.reviewCount,
          openingTime: fac.openingTime,
          closingTime: fac.closingTime,
          is247: fac.is247,
          featured: fac.featured,
          photos: parsedPhotos,
          startingPrice: fac.pricing?.hourlyRate || 40,
          dailyMaxPrice: fac.pricing?.dailyMaxRate || 300,
          pricing: fac.pricing,
          amenities: amenityList,
          availableSlots: summary.availableSlots,
          totalSlots: summary.totalSlots,
          statusMap: summary,
        };
      })
    );

    // Filter by radius & price
    let filteredResults = results.filter((r) => r.distance <= maxRadius);

    if (minPrice) {
      filteredResults = filteredResults.filter((r) => r.startingPrice >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filteredResults = filteredResults.filter((r) => r.startingPrice <= parseFloat(maxPrice));
    }
    if (amenities) {
      const requiredAmenities = amenities.split(',').map((a) => a.trim());
      filteredResults = filteredResults.filter((r) =>
        requiredAmenities.every((reqA) => r.amenities.includes(reqA))
      );
    }

    // Sort results
    if (sortBy === 'lowest_price') {
      filteredResults.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'highest_rating') {
      filteredResults.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'most_available') {
      filteredResults.sort((a, b) => b.availableSlots - a.availableSlots);
    } else {
      // Default: nearest
      filteredResults.sort((a, b) => a.distance - b.distance);
    }

    return sendSuccess(res, 'Parking search results', filteredResults, 200, {
      total: filteredResults.length,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Parking search failed', 'SERVER_ERROR', 500);
  }
};

export const getFacilityDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.query as Record<string, string>;

    const facility = await prisma.parkingFacility.findUnique({
      where: { id },
      include: {
        pricing: true,
        amenities: true,
        owner: {
          select: {
            businessName: true,
            user: { select: { name: true, phone: true, email: true } },
          },
        },
        reviews: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!facility) {
      return sendError(res, 'Parking facility not found', 'NOT_FOUND', 404);
    }

    const reqStart = startTime ? new Date(startTime) : new Date();
    const reqEnd = endTime ? new Date(endTime) : new Date(Date.now() + 3 * 60 * 60 * 1000);

    const { slots, summary } = await getFacilitySlotStatusMap(facility.id, reqStart, reqEnd);

    let parsedPhotos: string[] = [];
    try {
      parsedPhotos = JSON.parse(facility.photos || '[]');
    } catch (e) {
      parsedPhotos = [];
    }

    return sendSuccess(res, 'Facility details fetched', {
      ...facility,
      photos: parsedPhotos,
      amenities: facility.amenities.map((a) => a.amenity),
      slots,
      availabilitySummary: summary,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch facility details', 'SERVER_ERROR', 500);
  }
};
