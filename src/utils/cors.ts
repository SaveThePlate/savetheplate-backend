/**
 * Centralized CORS/origin handling so deployments can move domains without code edits.
 *
 * Env vars:
 * - CORS_ALLOWED_ORIGINS: comma-separated list of exact origins (e.g. "https://app.com,https://admin.app.com")
 * - CORS_ALLOWED_ORIGIN_SUFFIXES: comma-separated list of suffixes (e.g. ".example.com")
 * - CORS_ALLOW_LOCALHOST: "true" | "false" (defaults to true in non-production)
 */
export function parseCommaList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getConfiguredAllowedOrigins(): string[] {
  const envOrigins = parseCommaList(process.env.CORS_ALLOWED_ORIGINS);

  // Support existing env var names used across the repo.
  const frontendFromEnv = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_FRONTEND_URL,
    process.env.FRONT_URL,
  ].filter(Boolean) as string[];

  // De-duplicate while preserving order.
  return Array.from(new Set([...frontendFromEnv, ...envOrigins]));
}

export function getConfiguredAllowedOriginSuffixes(): string[] {
  const suffixes = parseCommaList(process.env.CORS_ALLOWED_ORIGIN_SUFFIXES);

  // Backwards-compatible default: allow staging suffixes only when NOT in production.
  if (suffixes.length === 0 && process.env.NODE_ENV !== 'production') {
    return ['.ccdev.space'];
  }

  return suffixes;
}

export function shouldAllowLocalhostOrigins(): boolean {
  const raw = process.env.CORS_ALLOW_LOCALHOST;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  // Default: allow localhost in dev/staging.
  return process.env.NODE_ENV !== 'production';
}

export function isOriginAllowed(origin?: string | null): boolean {
  if (!origin) return true; // curl / server-to-server / mobile apps without Origin header

  // Localhost support (dev).
  if (shouldAllowLocalhostOrigins()) {
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return true;
    }
  }

  // Exact match list.
  const allowed = getConfiguredAllowedOrigins();
  if (allowed.includes(origin)) return true;

  // Suffix allowlist.
  const suffixes = getConfiguredAllowedOriginSuffixes();
  if (suffixes.some((s) => origin.endsWith(s))) return true;

  return false;
}




