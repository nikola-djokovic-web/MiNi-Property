import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import bcrypt from 'bcryptjs';
import { publicUser, requireUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const { name, email, profileImage } = await request.json();
    const sessionUser = await requireUser();

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      profileImage?: string | null;
      passwordHash?: string;
    } = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData
    });

    // Return user data excluding sensitive fields
    const responseUser = publicUser(updatedUser);

    return NextResponse.json({ user: responseUser });
  } catch (error: any) {
    if (error?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}