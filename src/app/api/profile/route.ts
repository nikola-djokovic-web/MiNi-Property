import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const { userId, name, email, profileImage, currentPassword, newPassword } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
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

    // Handle password change
    if (currentPassword && newPassword) {
      // Verify current password
      if (!user.passwordHash) {
        return NextResponse.json({ error: 'No password set for this account' }, { status: 400 });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash new password
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Return user data excluding sensitive fields
    const responseUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      tenantId: updatedUser.tenantId,
      profileImage: (updatedUser as any).profileImage || null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return NextResponse.json({ user: responseUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}