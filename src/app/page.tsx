'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import OnboardingFlow from '@/components/OnboardingFlow';
import Dashboard from '@/components/Dashboard';

// Notification component
const Notification = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div className={`notification notification-${type} max-w-sm`}>
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <i className={`fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} text-lg`}></i>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
        <i className="fas fa-times"></i>
      </button>
    </div>
  </div>
);

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [userGoal, setUserGoal] = useState<{
    description: string;
    amount: number;
    date: string;
  }>({ description: '', amount: 0, date: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  }>>([]);
  const dashboardRef = useRef<{ startListening: () => void }>(null);

  // Initialize app
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      showNotification('Welcome to FinanceAI Co-Pilot! 🚀', 'success');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Function to handle dashboard launch
  const handleDashboardLaunch = (goal: {
    description: string;
    amount: number;
    date: string;
  }) => {
    setUserGoal(goal);
    setShowDashboard(true);
    showNotification('Dashboard loaded! Your financial journey begins now.', 'success');
  };

  // Function to handle voice toggle from header
  const handleVoiceToggle = () => {
    if (showDashboard && dashboardRef.current) {
      dashboardRef.current.startListening();
      showNotification('Voice assistant activated. Ask me anything!', 'info');
    } else {
      showNotification('Please complete the onboarding process to use voice features.', 'info');
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-secondary-600 to-primary-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 mx-auto mb-6">
            <div className="w-full h-full border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-3xl font-bold mb-2">FinanceAI Co-Pilot</h1>
          <p className="text-xl opacity-90">Initializing your financial assistant...</p>
          <div className="mt-6 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header onVoiceToggle={handleVoiceToggle} />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className={`transition-all duration-700 ${showDashboard ? 'fade-in-up' : 'slide-in-right'}`}>
            {!showDashboard ? (
              <OnboardingFlow onDashboardLaunch={handleDashboardLaunch} />
            ) : (
              <Dashboard 
                ref={dashboardRef}
                userGoal={userGoal} 
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </>
  );
}
