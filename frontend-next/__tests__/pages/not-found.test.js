// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import NotFound from '@/app/not-found';

describe('NotFound Page Component', () => {
  it('should render 404 error code and description', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const root = createRoot(container);
    root.render(React.createElement(NotFound));
    
    // Allow React to flush updates synchronously or query DOM
    // For simple static render, jsdom should reflect it.
    // Let's verify by checking the inner HTML after a small timeout or microtask
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(container.innerHTML).toContain('404');
        expect(container.innerHTML).toContain('Halaman Tidak Ditemukan');
        expect(container.innerHTML).toContain('Kembali ke Dashboard');
        
        // Clean up
        root.unmount();
        document.body.removeChild(container);
        resolve();
      }, 0);
    });
  });
});
