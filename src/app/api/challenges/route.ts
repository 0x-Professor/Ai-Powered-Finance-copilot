import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const { challengeId, userId } = await request.json();

    // Update challenge as completed
    const challenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        status: 'Completed',
        currentDays: 0, // Reset for next time
        endDate: new Date()
      }
    });

    // Award points to user (in a real app, you'd have a points system)
    console.log(`User ${userId} completed challenge and earned ${challenge.points} points`);

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, description, targetAmount, targetDays, category, points } = await request.json();

    const challenge = await prisma.challenge.create({
      data: {
        userId,
        title,
        description,
        targetAmount,
        targetDays,
        category,
        points
      }
    });

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}