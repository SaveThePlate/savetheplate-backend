import fs from 'fs';
import path from 'path';

type LoadEnvResult = {
  loadedFiles: string[];
};

function stripOptionalQuotes(value: string): string {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    const inner = v.slice(1, -1);
    // Basic unescape for common sequences
    return inner
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
  }
  // If unquoted, strip inline comments that start with whitespace + #
  return v.replace(/\s+#.*$/, '').trim();
}

function parseEnvFile(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = contents.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const m = rawLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    const valueRaw = m[2] ?? '';
    out[key] = stripOptionalQuotes(valueRaw);
  }
  return out;
}

function fileExists(p: string): boolean {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Deterministic env loading without extra dependencies.
 *
 * Precedence (later files only fill in missing keys, never overwrite existing process.env):
 * - If ENV_FILE is set: load only that file.
 * - Otherwise:
 *   - .env
 *   - .env.<NODE_ENV>
 *   - .env.local (only when NODE_ENV !== 'production')
 *   - .env.<NODE_ENV>.local
 *
 * This is safe for production: hosting-provided environment variables always win.
 */
export function loadEnvFromFiles(): LoadEnvResult {
  const cwd = process.cwd();
  const nodeEnv = process.env.NODE_ENV || 'development';
  const explicit = process.env.ENV_FILE;

  const candidates: string[] = [];
  if (explicit) {
    const p = path.isAbsolute(explicit) ? explicit : path.join(cwd, explicit);
    candidates.push(p);
  } else {
    candidates.push(path.join(cwd, '.env'));
    candidates.push(path.join(cwd, `.env.${nodeEnv}`));
    if (nodeEnv !== 'production') {
      candidates.push(path.join(cwd, '.env.local'));
    }
    candidates.push(path.join(cwd, `.env.${nodeEnv}.local`));
  }

  const loadedFiles: string[] = [];
  for (const p of candidates) {
    if (!fileExists(p)) continue;
    try {
      const contents = fs.readFileSync(p, 'utf-8');
      const parsed = parseEnvFile(contents);
      for (const [k, v] of Object.entries(parsed)) {
        if (process.env[k] === undefined) {
          process.env[k] = v;
        }
      }
      loadedFiles.push(p);
    } catch {
      // Ignore unreadable env files (permissions, etc.)
    }
  }

  // Dev-only visibility (avoid noisy logs in production)
  if (process.env.NODE_ENV !== 'production' && loadedFiles.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`🧩 Loaded env file(s): ${loadedFiles.map((f) => path.basename(f)).join(', ')}`);
  }

  return { loadedFiles };
}


