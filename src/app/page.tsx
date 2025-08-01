'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import OnboardingFlow from '@/components/OnboardingFlow';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [userGoal, setUserGoal] = useState<{
    description?: string;
    amount?: number;
    date?: string;
  }>({});

  // Function to handle dashboard launch
  const handleDashboardLaunch = (goal: {
    description: string;
    amount: number;
    date: string;
  }) => {
    setUserGoal(goal);
    setShowDashboard(true);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-6 py-8">
        {!showDashboard ? (
          <OnboardingFlow onDashboardLaunch={handleDashboardLaunch} />
        ) : (
          <Dashboard userGoal={userGoal} />
        )}
      </div>
    </>
  );
}
      </footer>
    </div>
  );
}
