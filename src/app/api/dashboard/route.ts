import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    // Get user data with all related information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        accounts: true,
        goals: true,
        expenses: {
          orderBy: { date: 'desc' },
          take: 50
        },
        budgets: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          }
        },
        challenges: {
          where: { status: 'Active' }
        }
      }
    });

    if (!user) {
      // Create demo user if doesn't exist
      const demoUser = await createDemoUser(userId);
      return NextResponse.json(demoUser);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function createDemoUser(userId: string) {
  // Create demo user with sample data
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: 'demo@financeai.com',
      name: 'Demo User',
      profile: {
        create: {
          monthlyIncome: 5200,
          riskProfile: 'Moderate',
          occupation: 'Software Engineer',
          age: 28
        }
      },
      accounts: {
        create: [
          {
            name: 'Main Checking',
            type: 'checking',
            balance: 12450,
            institution: 'Demo Bank'
          },
          {
            name: 'Savings Account',
            type: 'savings',
            balance: 8750,
            institution: 'Demo Bank'
          },
          {
            name: 'Investment Portfolio',
            type: 'investment',
            balance: 8750,
            institution: 'Investment Firm'
          }
        ]
      },
      goals: {
        create: [
          {
            title: 'Emergency Fund',
            description: 'Build 6 months of expenses',
            targetAmount: 15000,
            currentAmount: 3200,
            targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            category: 'emergency',
            priority: 'High'
          },
          {
            title: 'New Car',
            description: 'Save for a reliable vehicle',
            targetAmount: 25000,
            currentAmount: 5000,
            targetDate: new Date(Date.now() + 548 * 24 * 60 * 60 * 1000), // 18 months from now
            category: 'car',
            priority: 'Medium'
          }
        ]
      },
      budgets: {
        create: [
          {
            category: 'dining',
            amount: 700,
            spent: 850,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          {
            category: 'transport',
            amount: 450,
            spent: 420,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          {
            category: 'shopping',
            amount: 400,
            spent: 380,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          {
            category: 'entertainment',
            amount: 200,
            spent: 250,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          {
            category: 'bills',
            amount: 650,
            spent: 640,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          {
            category: 'other',
            amount: 350,
            spent: 300,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          }
        ]
      },
      challenges: {
        create: [
          {
            title: 'Coffee Break Challenge',
            description: 'Skip buying coffee for a week and save $25',
            targetAmount: 25,
            currentAmount: 15,
            targetDays: 5,
            currentDays: 3,
            category: 'coffee',
            points: 50
          },
          {
            title: 'Meal Prep Master',
            description: 'Prepare meals at home for 2 weeks and save $120',
            targetAmount: 120,
            currentAmount: 35,
            targetDays: 14,
            currentDays: 4,
            category: 'dining',
            points: 100
          }
        ]
      },
      expenses: {
        create: [
          // Recent expenses for the current month
          {
            amount: 45.50,
            category: 'dining',
            description: 'Restaurant dinner',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            amount: 85.00,
            category: 'transport',
            description: 'Gas station',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            amount: 120.00,
            category: 'shopping',
            description: 'Grocery store',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            amount: 25.00,
            category: 'entertainment',
            description: 'Movie tickets',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          },
          {
            amount: 200.00,
            category: 'bills',
            description: 'Electricity bill',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    },
    include: {
      profile: true,
      accounts: true,
      goals: true,
      expenses: {
        orderBy: { date: 'desc' },
        take: 50
      },
      budgets: {
        where: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }
      },
      challenges: {
        where: { status: 'Active' }
      }
    }
  });

  return user;
}