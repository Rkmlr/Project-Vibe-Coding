import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginForm from '@/presentation/auth/LoginForm';
import { login, signup } from '@/api-clients/authClient';

// Mock server actions
vi.mock('@/api-clients/authClient', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

describe('LoginForm Presentation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<LoginForm />);
    expect(screen.getByText('Selamat Datang di FamFi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Akses Ruang Kerja' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Alamat Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kata Sandi/i)).toBeInTheDocument();
  });

  it('switches to signup mode when clicking "Daftar Baru"', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.click(screen.getByRole('button', { name: 'Daftar Baru' }));
    
    expect(screen.getByText('Buat Akun Keluarga Baru')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Anda/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daftar & Onboarding' })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    login.mockResolvedValueOnce({ success: true });
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };

    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.type(screen.getByLabelText(/Alamat Email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Kata Sandi/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Akses Ruang Kerja' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('displays error message on failed login', async () => {
    login.mockResolvedValueOnce({ error: 'Email atau password salah' });

    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.type(screen.getByLabelText(/Alamat Email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Kata Sandi/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Akses Ruang Kerja' }));

    await waitFor(() => {
      expect(screen.getByText('Email atau password salah')).toBeInTheDocument();
    });
  });

  it('handles successful signup and switches back to login if email confirmation is required', async () => {
    signup.mockResolvedValueOnce({ success: true, requiresEmailConfirmation: true });

    const user = userEvent.setup();
    render(<LoginForm />);
    
    // Switch to signup
    await user.click(screen.getByRole('button', { name: 'Daftar Baru' }));
    
    await user.type(screen.getByLabelText(/Nama Anda/i), 'John');
    await user.type(screen.getByLabelText(/Alamat Email/i), 'john@test.com');
    await user.type(screen.getByLabelText(/Kata Sandi/i), 'password123');
    await user.type(screen.getByLabelText(/Nama Keluarga Baru/i), 'John Family');
    
    await user.click(screen.getByRole('button', { name: 'Daftar & Onboarding' }));

    await waitFor(() => {
      expect(signup).toHaveBeenCalled();
      expect(screen.getByText(/Pendaftaran berhasil! Silakan cek email Anda/i)).toBeInTheDocument();
      // Should switch back to login mode
      expect(screen.getByText('Selamat Datang di FamFi')).toBeInTheDocument();
    });
  });
});
