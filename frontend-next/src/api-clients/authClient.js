/**
 * API CLIENT — Auth Client
 *
 * Client-side helper functions wrapping authentication API endpoints.
 */

/**
 * Login user
 */
export async function login(formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal masuk");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Register and onboard user (create or join family)
 */
export async function signup(state, formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const displayName = formData.get("displayName");
  const mode = formData.get("mode"); // "create" or "join"
  const familyName = formData.get("familyName");
  const inviteCode = formData.get("inviteCode");

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        display_name: displayName,
        mode,
        family_name: familyName,
        invite_code: inviteCode
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mendaftar");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
