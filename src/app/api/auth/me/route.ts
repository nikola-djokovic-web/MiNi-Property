import { NextResponse } from 'next/server';
import { getSessionUser, publicUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}