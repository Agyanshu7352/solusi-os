import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Logout error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Logout failed.' },
      { status: 500 }
    );
  }
}
