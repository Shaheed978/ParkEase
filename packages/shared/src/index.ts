// Enums & Types for ParkEase

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN'
}

export enum VehicleType {
  FOUR_WHEELER = 'FOUR_WHEELER',
  TWO_WHEELER = 'TWO_WHEELER',
  EV = 'EV',
  ACCESSIBLE = 'ACCESSIBLE'
}

export enum FacilityStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum SlotCategory {
  REGULAR = 'REGULAR',
  PREMIUM = 'PREMIUM',
  DISABLED = 'DISABLED',
  EV = 'EV',
  TWO_WHEELER = 'TWO_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER'
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  HELD = 'HELD',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  BLOCKED = 'BLOCKED'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_USER = 'WAITING_FOR_USER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum NotificationCategory {
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  PARKING = 'PARKING',
  ACCOUNT = 'ACCOUNT'
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PriceCalculationRequest {
  facilityId: string;
  slotId?: string;
  vehicleType: VehicleType;
  startTime: string;
  endTime: string;
  couponCode?: string;
}

export interface PriceCalculationResult {
  basePrice: number;
  hours: number;
  isWeekend: boolean;
  weekendSurge: number;
  vehicleTypeMultiplier: number;
  vehicleModifierAmount: number;
  slotTypeModifier: number;
  evChargingFee: number;
  subtotal: number;
  discountAmount: number;
  platformFee: number;
  taxAmount: number;
  finalTotal: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
  appliedCoupon?: {
    code: string;
    discount: number;
  };
}

export interface SlotAvailabilitySummary {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  heldSlots: number;
  maintenanceSlots: number;
  blockedSlots: number;
}
