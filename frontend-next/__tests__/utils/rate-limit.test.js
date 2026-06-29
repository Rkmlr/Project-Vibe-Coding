import { describe, it, expect, vi } from 'vitest';
import { rateLimit } from '@/utils/rate-limit';
import { createMockRequest } from '../helpers/requestMock';

describe('rateLimit Utility', () => {
  it('should allow the first request from a new IP', () => {
    const req = createMockRequest({ headers: { 'x-forwarded-for': '192.168.1.1' } });
    const result = rateLimit(req, 5, 60000);
    expect(result).toBe(true);
  });

  it('should allow requests up to the limit', () => {
    const ip = '192.168.1.2';
    // Make 5 requests (limit is 5)
    for (let i = 0; i < 5; i++) {
      const req = createMockRequest({ headers: { 'x-forwarded-for': ip } });
      expect(rateLimit(req, 5, 60000)).toBe(true);
    }
  });

  it('should deny requests exceeding the limit', () => {
    const ip = '192.168.1.3';
    // Make 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const req = createMockRequest({ headers: { 'x-forwarded-for': ip } });
      rateLimit(req, 5, 60000);
    }
    // 6th request should fail
    const reqExceeded = createMockRequest({ headers: { 'x-forwarded-for': ip } });
    expect(rateLimit(reqExceeded, 5, 60000)).toBe(false);
  });

  it('should track different IPs independently', () => {
    const ipA = '192.168.1.4';
    const ipB = '192.168.1.5';

    // Exceed limit for IP A
    for (let i = 0; i < 6; i++) {
      const req = createMockRequest({ headers: { 'x-forwarded-for': ipA } });
      rateLimit(req, 5, 60000);
    }

    // IP B should still be allowed on its first request
    const reqB = createMockRequest({ headers: { 'x-forwarded-for': ipB } });
    expect(rateLimit(reqB, 5, 60000)).toBe(true);
  });

  it('should reset limit after windowMs has elapsed', () => {
    const ip = '192.168.1.6';
    vi.useFakeTimers();

    // Limit is 2 in a 10s window
    const req1 = createMockRequest({ headers: { 'x-forwarded-for': ip } });
    const req2 = createMockRequest({ headers: { 'x-forwarded-for': ip } });
    const req3 = createMockRequest({ headers: { 'x-forwarded-for': ip } });

    expect(rateLimit(req1, 2, 10000)).toBe(true);
    expect(rateLimit(req2, 2, 10000)).toBe(true);
    expect(rateLimit(req3, 2, 10000)).toBe(false); // Denied

    // Advance time by 11 seconds
    vi.advanceTimersByTime(11000);

    // Should be allowed again
    const req4 = createMockRequest({ headers: { 'x-forwarded-for': ip } });
    expect(rateLimit(req4, 2, 10000)).toBe(true);

    vi.useRealTimers();
  });
});
