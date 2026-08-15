import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        phone: true,
        avatar: true,
      },
    });

    // Generic error to prevent user enumeration
    const INVALID_CREDENTIALS = 'Invalid email or password.';

    if (!user) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // Verify password hash
    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // Create server-side session and set HttpOnly cookie
    await createSession(user.id);

    // Return safe user data (no passwordHash, no internal IDs)
    const avatar = user.avatar || user.name.substring(0, 2).toUpperCase();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar,
      },
    });
  } catch (error: unknown) {
    console.error('Login error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'An internal error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
