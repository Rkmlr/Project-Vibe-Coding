import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router globally
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  }
}));

// Mock React logic for Next.js actions (Server Actions usually run on server, 
// so for UI testing we might mock them per file, but basic browser features are here)
