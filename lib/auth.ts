import { cookies } from 'next/headers';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

// ─── Password Hashing (Node.js native crypto.scrypt) ────────────────────────

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

/**
 * Hash a plaintext password using scrypt with a random salt.
 * Returns "salt:hash" in hex encoding.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a plaintext password against a stored "salt:hash" string.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const storedKey = Buffer.from(hashHex, 'hex');
  const derivedKey = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);

  return timingSafeEqual(storedKey, derivedKey);
}

// ─── Session Management ─────────────────────────────────────────────────────

const SESSION_COOKIE_NAME = 'solusi_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Create a new session for the given user and set an HttpOnly cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

/**
 * Read the session cookie and validate it against the database.
 * Returns the session with the user if valid, or null.
 */
export async function validateSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
        },
      },
    },
  });

  if (!session) return null;

  // Check expiration
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session;
}

/**
 * Destroy the current session: delete from DB and clear cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// ─── Auth Guard Utilities (for Route Handlers) ──────────────────────────────

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  avatar: string | null;
};

/**
 * Require authentication. Returns the authenticated user or throws a Response.
 * Use in API route handlers:
 *
 *   const user = await requireAuth();
 */
export async function requireAuth(): Promise<SafeUser> {
  const session = await validateSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: 'Authentication required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return session.user;
}

/**
 * Require a specific role (or one of several roles).
 * Returns the authenticated user or throws a 401/403 Response.
 *
 *   const user = await requireRole('owner', 'admin');
 */
export async function requireRole(...allowedRoles: string[]): Promise<SafeUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Response(
      JSON.stringify({ error: 'You do not have permission to perform this action.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return user;
}
