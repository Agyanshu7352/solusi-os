import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // 1. Check Prisma database for seeded / registered user
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: emailLower }
      });
    } catch (dbErr) {
      console.warn('Prisma lookup warning during auth:', dbErr);
    }

    if (dbUser) {
      const avatar = dbUser.avatar || dbUser.name.substring(0, 2).toUpperCase();
      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role === 'owner' ? 'Owner & Systems Admin' : dbUser.role.toUpperCase(),
          phone: dbUser.phone,
          avatar
        }
      });
    }

    // 2. Allow system admins & workspace domains
    const allowedEmails = ['shivay7352@gmail.com', 'shubham@solusidesign.com', 'admin@solusidesign.com'];
    const isAuthorizedDomain =
      allowedEmails.includes(emailLower) ||
      emailLower.endsWith('@solusidesign.com') ||
      emailLower.endsWith('@solusi.com') ||
      emailLower.endsWith('@solusios.com');

    if (isAuthorizedDomain) {
      const namePart = emailLower.split('@')[0];
      const formattedName =
        emailLower === 'shivay7352@gmail.com'
          ? 'Shivay'
          : namePart.charAt(0).toUpperCase() + namePart.slice(1);

      return NextResponse.json({
        success: true,
        user: {
          id: 'admin-workspace-id',
          name: formattedName,
          email: emailLower,
          role: emailLower === 'shivay7352@gmail.com' ? 'Owner & Systems Admin' : 'Commercial Operations',
          avatar: namePart.substring(0, 2).toUpperCase()
        }
      });
    }

    return NextResponse.json(
      { error: 'Access denied. Unrecognized email account or invalid credentials.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error during login API request:', error);
    return NextResponse.json({ error: error.message || 'Authentication server error.' }, { status: 500 });
  }
}
