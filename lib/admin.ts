export function getAdminSecret() {
  return process.env.ADMIN_SECRET?.trim() || "";
}

export function isAdminProtectionEnabled() {
  return getAdminSecret().length > 0;
}

export function isValidAdminSecret(value: string | null | undefined) {
  const secret = getAdminSecret();
  if (!secret) return true;
  return value === secret;
}

export function adminUrl(path: string, secret: string | null | undefined) {
  if (!secret) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}admin=${encodeURIComponent(secret)}`;
}
