import { generateSecureQrToken, verifyQrToken } from '../utils/qr';

describe('QR Security Unit Tests', () => {
  test('should generate and successfully verify valid QR token', () => {
    const bookingCode = 'PE-2026-TEST01';
    const slotNumber = 'A05';
    const userId = 'user_12345';

    const token = generateSecureQrToken(bookingCode, slotNumber, userId);
    expect(token).toBeDefined();
    expect(token.includes(bookingCode)).toBe(true);

    const verification = verifyQrToken(token);
    expect(verification.valid).toBe(true);
    expect(verification.bookingCode).toBe(bookingCode);
    expect(verification.slotNumber).toBe(slotNumber);
    expect(verification.userId).toBe(userId);
  });

  test('should reject tampered or forged QR tokens', () => {
    const fakeToken = 'PE-2026-TEST01:A05:user_12345:1700000000:FORGED_SIG_99';
    const verification = verifyQrToken(fakeToken);
    expect(verification.valid).toBe(false);
  });
});
