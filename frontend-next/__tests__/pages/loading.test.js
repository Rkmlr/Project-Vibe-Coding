// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Loading from '@/app/loading';

describe('Loading Page Component', () => {
  it('should render the loading page with spinner', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const root = createRoot(container);
    root.render(React.createElement(Loading));
    
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(container.innerHTML).toContain('Loading...');
        
        // Check for presence of spinner class (animate-spin)
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).not.toBeNull();
        
        // Clean up
        root.unmount();
        document.body.removeChild(container);
        resolve();
      }, 0);
    });
  });
});
