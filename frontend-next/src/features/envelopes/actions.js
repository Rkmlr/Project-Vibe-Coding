/**
 * Create a new envelope
 */
export async function createEnvelope(name, limitAmount, category, assignedTo = null) {
  try {
    const res = await fetch('/api/envelopes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, limit_amount: limitAmount, category, assigned_to: assignedTo })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return { success: true, data: data.data };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Update an envelope's name, limit, and category
 */
export async function updateEnvelope(envelopeId, name, limitAmount, category, assignedTo = null) {
  try {
    const res = await fetch(`/api/envelopes/${envelopeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, limit_amount: limitAmount, category, assigned_to: assignedTo })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return { success: true, data: data.data };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Delete an envelope and handle remaining balance (reallocate or return to Cash Pool)
 */
export async function deleteEnvelope(envelopeId, reallocateToId = null) {
  try {
    const res = await fetch(`/api/envelopes/${envelopeId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reallocateToId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Rollover (Close Monthly Book)
 */
export async function closeMonthlyBook(method, savingsEnvelopeId = null) {
  try {
    const res = await fetch('/api/envelopes/close-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, savingsEnvelopeId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
