/**
 * Add a new transaction (Income or Expense)
 */
export async function addTransaction(payload) {
  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: payload.type,
        amount: payload.amount,
        description: payload.description,
        source: "APP",
        envelope_id: payload.envelopeId || null,
        category: payload.category
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mencatat transaksi");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Transfer funds between envelopes or from Main Cash Pool to an envelope
 */
export async function transferBalance(payload) {
  try {
    const res = await fetch('/api/transactions/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_envelope_id: payload.sourceEnvelopeId || null,
        to_envelope_id: payload.targetEnvelopeId,
        amount: payload.amount,
        description: payload.description
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mentransfer dana");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
