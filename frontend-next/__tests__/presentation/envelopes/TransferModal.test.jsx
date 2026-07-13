import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransferModal from '@/presentation/envelopes/TransferModal';
import { transferBalance } from '@/api-clients/transactionClient';

vi.mock('@/api-clients/transactionClient', () => ({
  transferBalance: vi.fn(),
}));

describe('TransferModal Presentation Component', () => {
  const mockEnvelopes = [
    { id: 'env-1', name: 'Makanan', balance: 100000 },
    { id: 'env-2', name: 'Bensin', balance: 50000 },
  ];
  
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <TransferModal isOpen={false} onClose={mockOnClose} envelopes={mockEnvelopes} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <TransferModal isOpen={true} onClose={mockOnClose} envelopes={mockEnvelopes} />
    );
    expect(screen.getByText('Transfer Anggaran')).toBeInTheDocument();
    // Default source is Kas Utama
    expect(screen.getByDisplayValue('Kas Utama Keluarga (Dompet)')).toBeInTheDocument();
  });



  it('calls transferBalance and onSuccess when form is valid', async () => {
    transferBalance.mockResolvedValueOnce({ success: true });
    
    const user = userEvent.setup();
    render(
      <TransferModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} envelopes={mockEnvelopes} />
    );

    await user.selectOptions(screen.getByLabelText(/Pilih Amplop Target/i), 'env-1');
    await user.type(screen.getByLabelText(/Jumlah Transfer/i), '50000');
    await user.type(screen.getByLabelText(/Keterangan/i), 'Buat makan siang');
    
    await user.click(screen.getByRole('button', { name: 'Proses Transfer' }));

    await waitFor(() => {
      expect(transferBalance).toHaveBeenCalledWith({
        sourceEnvelopeId: null, // Because source was left as ""
        targetEnvelopeId: 'env-1',
        amount: 50000,
        description: 'Buat makan siang'
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays API error if transferBalance fails', async () => {
    transferBalance.mockResolvedValueOnce({ error: 'Saldo tidak cukup' });
    
    const user = userEvent.setup();
    render(
      <TransferModal isOpen={true} onClose={mockOnClose} envelopes={mockEnvelopes} />
    );

    await user.selectOptions(screen.getByLabelText(/Pilih Sumber Dana/i), 'env-1');
    await user.selectOptions(screen.getByLabelText(/Pilih Amplop Target/i), 'env-2');
    await user.type(screen.getByLabelText(/Jumlah Transfer/i), '200000');
    
    await user.click(screen.getByRole('button', { name: 'Proses Transfer' }));

    await waitFor(() => {
      expect(screen.getByText('Saldo tidak cukup')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
