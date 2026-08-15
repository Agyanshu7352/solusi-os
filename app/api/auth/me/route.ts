import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await validateSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: session.user,
    });
  } catch (error: unknown) {
    console.error('Session check error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Session validation failed.' },
      { status: 500 }
    );
  }
}
