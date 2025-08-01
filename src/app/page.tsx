'use client';

import { useState, useEffect, useRef } from 'react';
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
  const dashboardRef = useRef<any>(null);

  // Function to handle dashboard launch
  const handleDashboardLaunch = (goal: {
    description: string;
    amount: number;
    date: string;
  }) => {
    setUserGoal(goal);
    setShowDashboard(true);
  };

  // Function to handle voice toggle from header
  const handleVoiceToggle = () => {
    if (showDashboard && dashboardRef.current) {
      // Call startListening or stopListening on the Dashboard component
      if (dashboardRef.current.startListening) {
        dashboardRef.current.startListening();
      }
    }
  };

  return (
    <>
      <Header onVoiceToggle={handleVoiceToggle} />
      <div className="container mx-auto px-6 py-8">
        {!showDashboard ? (
          <OnboardingFlow onDashboardLaunch={handleDashboardLaunch} />
        ) : (
          <Dashboard 
            ref={dashboardRef}
            userGoal={userGoal} 
          />
        )}
      </div>
    </>
  );
}
