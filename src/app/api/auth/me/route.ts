import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth/me endpoint called');
    // Get the tenant ID from headers
    const tenantId = request.headers.get('x-tenant-id');
    const userEmail = request.headers.get('x-user-email');
    console.log('📋 Tenant ID from headers:', tenantId);
    console.log('📧 User email from headers:', userEmail);
    
    if (!tenantId) {
      console.log('❌ No tenant ID provided');
      return NextResponse.json({ error: 'No tenant ID provided' }, { status: 400 });
    }

    if (!userEmail) {
      console.log('❌ No user email provided');
      return NextResponse.json({ error: 'No user email provided' }, { status: 400 });
    }

    // Create user object from the passed email
    const currentUser = {
      email: userEmail,
      role: 'tenant' as const, // We assume if they're calling this endpoint they're a tenant
      propertyId: null as string | null,
    };

    console.log('👤 Current user from headers:', currentUser);

    // If user is a tenant, try to find their property assignment
    if (currentUser.role === 'tenant') {
      console.log('🏠 Looking for tenant property assignment...');
      try {
        // Look for the user in the database by email and get their direct property assignment
        const dbUser = await prisma.user.findFirst({
          where: {
            email: currentUser.email,
            tenantId: tenantId, // Make sure we're looking in the right tenant
          }
        });

        console.log('🗃️ Database user found:', dbUser);
        if (dbUser && (dbUser as any).propertyId) {
          console.log('✅ Property assignment found:', (dbUser as any).propertyId);
          currentUser.propertyId = (dbUser as any).propertyId;
        } else {
          console.log('❌ No property assignment found for tenant');
        }
      } catch (error) {
        console.error('Error fetching tenant property:', error);
      }
    }

    console.log('📤 Returning user data:', currentUser);
    return NextResponse.json({ 
      user: currentUser,
      success: true 
    });

  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}