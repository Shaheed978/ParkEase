import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting ParkEase database seed process...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slotHold.deleteMany();
  await prisma.parkingSlot.deleteMany();
  await prisma.parkingPricing.deleteMany();
  await prisma.facilityAmenity.deleteMany();
  await prisma.parkingFacility.deleteMany();
  await prisma.parkingOwner.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const commonPassword = await bcrypt.hash('Password123', 10);

  // 1. Create Users
  const customerUser = await prisma.user.create({
    data: {
      email: 'user@parkease.com',
      passwordHash: commonPassword,
      name: 'Rahul Sharma',
      phone: '+919876543210',
      role: 'CUSTOMER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@parkease.com',
      passwordHash: commonPassword,
      name: 'Venkatesh Rao',
      phone: '+919812345678',
      role: 'OWNER',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@parkease.com',
      passwordHash: commonPassword,
      name: 'ParkEase Admin',
      phone: '+919900000000',
      role: 'ADMIN',
    },
  });

  // 2. Create Owner Profile
  const ownerProfile = await prisma.parkingOwner.create({
    data: {
      userId: ownerUser.id,
      businessName: 'Apex Parking Solutions Pvt Ltd',
      gstin: '29ABCDE1234F1Z5',
      isVerified: true,
      bankAccountName: 'Apex Parking Solutions',
      bankAccountNumber: '987654321098',
      bankIfsc: 'HDFC0001234',
      totalEarnings: 15420.0,
    },
  });

  // 3. Create Vehicles for Customer
  const customerVehicle = await prisma.vehicle.create({
    data: {
      userId: customerUser.id,
      vehicleNumber: 'KA-01-MJ-4050',
      vehicleType: 'EV',
      brand: 'Tata',
      model: 'Nexon EV Max',
      color: 'Teal Blue',
      isEv: true,
      isDefault: true,
    },
  });

  await prisma.vehicle.create({
    data: {
      userId: customerUser.id,
      vehicleNumber: 'KA-03-HA-8819',
      vehicleType: 'TWO_WHEELER',
      brand: 'Ather',
      model: '450X',
      color: 'Space Grey',
      isEv: true,
      isDefault: false,
    },
  });

  // 4. Facilities Data
  const facilitiesData = [
    {
      name: 'MG Road Metro Mall Smart Parking',
      description: 'Ultra-modern covered multi-level parking facility right next to MG Road Metro Station with 24/7 security and fast EV chargers.',
      address: '45 MG Road, Near Trinity Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.9756,
      longitude: 77.6066,
      openingTime: '05:00 AM',
      closingTime: '11:59 PM',
      is247: true,
      rules: 'Speed limit 10km/h. No smoking. EV charging slots reserved for electric vehicles only.',
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
      ]),
      hourlyRate: 50.0,
      dailyMaxRate: 350.0,
      rating: 4.9,
      reviewCount: 128,
      featured: true,
      amenities: ['CCTV', 'Security', 'Covered', 'EV_CHARGING', '24/7', 'Accessible'],
    },
    {
      name: 'Forum Rex Walk Underground Hub',
      description: 'Secure underground parking with valet service located in the heart of Brigade Road shopping district.',
      address: 'Brigade Road, Ashok Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.9702,
      longitude: 77.6074,
      openingTime: '06:00 AM',
      closingTime: '11:00 PM',
      is247: false,
      rules: 'Keep vehicle locked. Keep ticket handy for exit gate scan.',
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
      ]),
      hourlyRate: 60.0,
      dailyMaxRate: 400.0,
      rating: 4.7,
      reviewCount: 94,
      featured: true,
      amenities: ['CCTV', 'Security', 'Covered', 'Valet', 'Restroom'],
    },
    {
      name: 'Indiranagar 100ft Road Park Center',
      description: 'Convenient central parking facility close to top cafes and boutiques on 100ft Road Indiranagar.',
      address: '100 Feet Rd, HAL 2nd Stage, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.9784,
      longitude: 77.6408,
      hourlyRate: 40.0,
      dailyMaxRate: 280.0,
      rating: 4.8,
      reviewCount: 76,
      featured: false,
      amenities: ['CCTV', 'Security', 'Lighting', 'EV_CHARGING'],
    },
    {
      name: 'Koramangala 5th Block Commercial Garage',
      description: 'Spacious automated garage with wide bay access in Koramangala 5th Block.',
      address: '80 Feet Road, 5th Block, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.9352,
      longitude: 77.6245,
      hourlyRate: 35.0,
      dailyMaxRate: 250.0,
      rating: 4.6,
      reviewCount: 62,
      featured: false,
      amenities: ['CCTV', 'Security', 'Car_wash'],
    },
    {
      name: 'Majestic KSR Grand Station Multi-Level',
      description: 'High capacity multi-story parking facility adjoining Bengaluru City Railway Station and KSRTC Bus Stand.',
      address: 'Station Road, Subhash Nagar, Sevashrama',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.9781,
      longitude: 77.5697,
      hourlyRate: 30.0,
      dailyMaxRate: 200.0,
      rating: 4.5,
      reviewCount: 210,
      featured: false,
      amenities: ['CCTV', 'Security', 'Covered', '24/7', 'Restroom'],
    },
    {
      name: 'Mysuru Palace Heritage Visitor Parking',
      description: 'Official visitor parking lot opposite Mysuru Palace Gate 2 with coach & car bays.',
      address: 'Sayyaji Rao Rd, Agrahara',
      city: 'Mysuru',
      state: 'Karnataka',
      latitude: 12.3052,
      longitude: 76.6552,
      hourlyRate: 40.0,
      dailyMaxRate: 250.0,
      rating: 4.9,
      reviewCount: 155,
      featured: true,
      amenities: ['CCTV', 'Security', 'Lighting', 'Accessible', 'Restroom'],
    },
    {
      name: 'Hitech City Cyber Towers Smart Hub',
      description: 'Tech-enabled multi-story park facility located in Hitech City tech park zone.',
      address: 'Cyber Towers Flyover, HITEC City',
      city: 'Hyderabad',
      state: 'Telangana',
      latitude: 17.4504,
      longitude: 78.3811,
      hourlyRate: 45.0,
      dailyMaxRate: 300.0,
      rating: 4.8,
      reviewCount: 88,
      featured: true,
      amenities: ['CCTV', 'Security', 'Covered', 'EV_CHARGING', '24/7'],
    },
  ];

  let totalGeneratedSlots = 0;

  for (const facData of facilitiesData) {
    const facility = await prisma.parkingFacility.create({
      data: {
        ownerId: ownerProfile.id,
        name: facData.name,
        description: facData.description,
        address: facData.address,
        city: facData.city,
        state: facData.state,
        latitude: facData.latitude,
        longitude: facData.longitude,
        openingTime: facData.openingTime || '06:00 AM',
        closingTime: facData.closingTime || '11:00 PM',
        is247: facData.is247 !== undefined ? facData.is247 : true,
        rules: facData.rules || 'Standard safety rules apply.',
        photos: facData.photos || JSON.stringify(['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80']),
        rating: facData.rating,
        reviewCount: facData.reviewCount,
        featured: facData.featured,
        status: 'APPROVED',
      },
    });

    // Create Pricing
    await prisma.parkingPricing.create({
      data: {
        facilityId: facility.id,
        hourlyRate: facData.hourlyRate,
        dailyMaxRate: facData.dailyMaxRate,
        weekendSurgePercent: 15.0,
        peakHourMultiplier: 1.2,
        evChargeRate: 25.0,
        platformFeePercent: 10.0,
      },
    });

    // Create Amenities
    for (const amen of facData.amenities) {
      await prisma.facilityAmenity.create({
        data: {
          facilityId: facility.id,
          amenity: amen,
        },
      });
    }

    // Generate 15 Slots for each facility (Total ~105 slots across 7 facilities)
    const slotCategories = ['REGULAR', 'REGULAR', 'REGULAR', 'PREMIUM', 'EV', 'DISABLED', 'TWO_WHEELER'];
    const slotTypes = ['FOUR_WHEELER', 'FOUR_WHEELER', 'FOUR_WHEELER', 'FOUR_WHEELER', 'EV', 'ACCESSIBLE', 'TWO_WHEELER'];

    for (let i = 1; i <= 15; i++) {
      const idx = (i - 1) % slotCategories.length;
      const slotNum = `A${i < 10 ? '0' + i : i}`;
      const category = slotCategories[idx];
      const vehicleType = slotTypes[idx];
      const priceModifier = category === 'PREMIUM' ? 20.0 : 0.0;

      await prisma.parkingSlot.create({
        data: {
          facilityId: facility.id,
          slotNumber: slotNum,
          floor: i <= 8 ? 'G' : 'F1',
          section: 'A',
          vehicleType,
          category,
          priceModifier,
          status: 'AVAILABLE',
        },
      });
      totalGeneratedSlots++;
    }

    await prisma.parkingFacility.update({
      where: { id: facility.id },
      data: { totalSlots: 15 },
    });
  }

  // 5. Coupons
  await prisma.coupon.create({
    data: {
      code: 'PARK50',
      discountPercent: 50.0,
      maxDiscount: 50.0,
      minOrder: 50.0,
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
      active: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'WELCOME20',
      fixedDiscount: 30.0,
      minOrder: 60.0,
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      active: true,
    },
  });

  // 6. Sample Active Booking for testing
  const mgRoadFacility = await prisma.parkingFacility.findFirst({
    where: { name: { contains: 'MG Road' } },
    include: { slots: true },
  });

  if (mgRoadFacility && mgRoadFacility.slots.length > 0) {
    const targetSlot = mgRoadFacility.slots[0];
    const bookingCode = `PE-2026-ACTIVE01`;
    const qrToken = `PE-2026-ACTIVE01:${targetSlot.slotNumber}:${customerUser.id}:${Date.now()}:DEMOSIG123`;

    const activeBooking = await prisma.booking.create({
      data: {
        bookingCode,
        qrToken,
        userId: customerUser.id,
        vehicleId: customerVehicle.id,
        facilityId: mgRoadFacility.id,
        slotId: targetSlot.id,
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
        basePrice: 150.0,
        taxAmount: 12.0,
        platformFee: 15.0,
        discountAmount: 20.0,
        totalAmount: 157.0,
        status: 'CONFIRMED',
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: activeBooking.id,
        orderId: `order_seed_01`,
        paymentId: `pay_seed_01`,
        amount: 157.0,
        paymentMethod: 'UPI',
        status: 'SUCCESS',
      },
    });

    await prisma.notification.create({
      data: {
        userId: customerUser.id,
        category: 'BOOKING',
        title: 'Active Parking Session',
        message: `Your booking at ${mgRoadFacility.name} (Slot ${targetSlot.slotNumber}) is confirmed.`,
        link: `/booking/${activeBooking.id}`,
      },
    });
  }

  console.log('✅ ParkEase Seeding completed successfully!');
  console.log(`👤 Customer Login: user@parkease.com / Password123`);
  console.log(`🏢 Owner Login: owner@parkease.com / Password123`);
  console.log(`👑 Admin Login: admin@parkease.com / Password123`);
  console.log(`🏢 Seeded Facilities: ${facilitiesData.length}`);
  console.log(`🅿️ Seeded Slots: ${totalGeneratedSlots}`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
