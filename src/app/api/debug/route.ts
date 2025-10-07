import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const invites = await prisma.invite.findMany({
      include: {
        property: true,
      }
    });

    const properties = await prisma.property.findMany();
    
    const users = await prisma.user.findMany({
      where: {
        role: 'tenant'
      }
    });

    return NextResponse.json({ 
      invites,
      properties,
      users,
      debug: true
    });

  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}