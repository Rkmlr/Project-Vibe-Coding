// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorPage from '@/app/error';

describe('Error Page Component', () => {
  it('should render error messages and trigger reset action', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const mockError = new Error('Test application crash');
    const mockReset = vi.fn();
    
    const root = createRoot(container);
    root.render(React.createElement(ErrorPage, { error: mockError, reset: mockReset }));
    
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(container.innerHTML).toContain('Terjadi Kesalahan!');
        expect(container.innerHTML).toContain('Coba Lagi');
        
        // Find reset button and trigger click
        const buttons = container.querySelectorAll('button');
        let resetButton = null;
        buttons.forEach((btn) => {
          if (btn.textContent.includes('Coba Lagi')) {
            resetButton = btn;
          }
        });
        
        expect(resetButton).toBeDefined();
        resetButton.click();
        
        expect(mockReset).toHaveBeenCalledTimes(1);
        
        // Clean up
        root.unmount();
        document.body.removeChild(container);
        resolve();
      }, 0);
    });
  });
});
