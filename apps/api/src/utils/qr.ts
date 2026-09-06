import QRCode from 'qrcode';
import crypto from 'crypto';

const QR_SECRET = process.env.JWT_SECRET || 'parkease_super_secret_jwt_key_2026_change_in_production';

export const generateSecureQrToken = (bookingCode: string, slotNumber: string, userId: string): string => {
  const timestamp = Date.now();
  const rawPayload = `${bookingCode}:${slotNumber}:${userId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(rawPayload)
    .digest('hex')
    .slice(0, 16);
  return `${rawPayload}:${signature}`;
};

export const verifyQrToken = (qrToken: string): { valid: boolean; bookingCode?: string; slotNumber?: string; userId?: string } => {
  try {
    const parts = qrToken.split(':');
    if (parts.length !== 5) return { valid: false };

    const [bookingCode, slotNumber, userId, timestampStr, signature] = parts;
    const rawPayload = `${bookingCode}:${slotNumber}:${userId}:${timestampStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', QR_SECRET)
      .update(rawPayload)
      .digest('hex')
      .slice(0, 16);

    if (signature !== expectedSignature) {
      return { valid: false };
    }

    return {
      valid: true,
      bookingCode,
      slotNumber,
      userId,
    };
  } catch (err) {
    return { valid: false };
  }
};

export const generateQrCodeDataUrl = async (token: string): Promise<string> => {
  return await QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
};
