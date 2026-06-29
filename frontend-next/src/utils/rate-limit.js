const rateLimitMap = new Map();

export function rateLimit(request, limit = 5, windowMs = 60000) {
  // Gunakan IP jika ada (biasanya di x-forwarded-for atau dari remoteAddress), fallback ke 'unknown'
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, {
      count: 0,
      resetTime: Date.now() + windowMs
    });
  }
  
  const tokenData = rateLimitMap.get(ip);
  
  // Jika window time sudah lewat, reset
  if (Date.now() > tokenData.resetTime) {
    tokenData.count = 0;
    tokenData.resetTime = Date.now() + windowMs;
  }
  
  tokenData.count += 1;
  
  if (tokenData.count > limit) {
    return false; // Rate limit exceeded
  }
  
  return true; // Allowed
}
