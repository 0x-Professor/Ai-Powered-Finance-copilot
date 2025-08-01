'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faCreditCard, faPiggyBank, faChartLine, faExclamationTriangle,
  faLightbulb, faCheckCircle, faCoffee, faUtensils, faUniversity,
  faCalculator, faChartPie, faDownload, faRobot, faPaperPlane,
  faMicrophoneAlt, faSpinner, faTrophy, faBell, faStar, faBolt,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import { Chart, registerables } from 'chart.js';
import { getFinancialAdvice, FinancialData } from '../utils/geminiApi';

// Register Chart.js components
Chart.register(...registerables);

interface DashboardProps {
  userGoal: {
    description?: string;
    amount?: number;
    date?: string;
  };
}

interface DashboardHandle {
  startListening: () => void;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  targetAmount?: number;
  currentAmount: number;
  targetDays: number;
  currentDays: number;
  category: string;
  points: number;
  status: string;
}

interface DashboardData {
  id: string;
  name: string;
  email: string;
  profile: {
    monthlyIncome: number;
    riskProfile: string;
    occupation?: string;
    age?: number;
  };
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    institution?: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    category: string;
    priority: string;
    status: string;
  }>;
  budgets: Array<{
    id: string;
    category: string;
    amount: number;
    spent: number;
    month: number;
    year: number;
  }>;
  challenges: Challenge[];
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    description?: string;
    date: string;
  }>;
}

const Dashboard = forwardRef<DashboardHandle, DashboardProps>(({ userGoal }, ref) => {
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [points, setPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const spendingChartRef = useRef<HTMLCanvasElement | null>(null);
  const spendingChartInstance = useRef<Chart | null>(null);

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsDataLoading(true);
      const response = await fetch('/api/dashboard?userId=demo-user');
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      setDashboardData(data);
      
      // Calculate total points from active challenges
      const totalPoints = data.challenges?.reduce((sum: number, challenge: Challenge) => sum + challenge.points, 0) || 0;
      setPoints(totalPoints);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Ask AI function with real data
  const askAI = useCallback(async () => {
    if (!aiInput.trim() || !dashboardData) return;
    
    setIsLoading(true);
    setShowAiPanel(true);
    
    try {
      // Use real financial data from database
      const financialData: FinancialData = {
        income: dashboardData.profile.monthlyIncome,
        expenses: dashboardData.budgets.reduce((acc, budget) => ({
          ...acc,
          [budget.category]: budget.spent
        }), {} as Record<string, number>),
        savings: dashboardData.accounts.find(acc => acc.type === 'savings')?.balance || 0,
        goal: userGoal,
        riskProfile: dashboardData.profile.riskProfile
      };
      
      const aiText = await getFinancialAdvice(aiInput, financialData);
      setAiResponse(aiText);
      setAiInput('');
    } catch (error) {
      console.error('Error calling AI:', error);
      setAiResponse('Sorry, I encountered an error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [aiInput, dashboardData, userGoal]);

  // Initialize spending chart with real data
  const initializeSpendingChart = useCallback(() => {
    if (!spendingChartRef.current || !dashboardData) return;
    
    const ctx = spendingChartRef.current.getContext('2d');
    if (!ctx) return;

    if (spendingChartInstance.current) {
      spendingChartInstance.current.destroy();
    }

    const categories = dashboardData.budgets.map(b => b.category.charAt(0).toUpperCase() + b.category.slice(1));
    const spentData = dashboardData.budgets.map(b => b.spent);
    const budgetData = dashboardData.budgets.map(b => b.amount);
    
    spendingChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Actual Spending',
            data: spentData,
            backgroundColor: 'rgba(14, 165, 233, 0.8)',
            borderColor: 'rgba(14, 165, 233, 1)',
            borderWidth: 2,
            borderRadius: 8
          },
          {
            label: 'Budget',
            data: budgetData,
            backgroundColor: 'rgba(156, 163, 175, 0.6)',
            borderColor: 'rgba(156, 163, 175, 1)',
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(14, 165, 233, 1)',
            borderWidth: 1,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.2)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value;
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }, [dashboardData]);

  // Initialize component
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Initialize spending chart when data is available
  useEffect(() => {
    if (dashboardData && dashboardData.budgets) {
      initializeSpendingChart();
    }
  }, [dashboardData, initializeSpendingChart]);

  // Voice interaction functions
  const [isListening, setIsListening] = useState(false);
  
  const startListening = async () => {
    if (!dashboardData) return;
    
    if (isListening) {
      setIsListening(false);
      setAiResponse('Listening stopped.');
      return;
    }
    
    setIsListening(true);
    setShowAiPanel(true);
    setIsLoading(true);
    
    const voiceQueries = [
      "How can I reduce my dining expenses?",
      "Should I invest in stocks or ETFs?",
      "How much should I save each month?",
      "Am I on track to meet my savings goal?",
      "What's the best way to pay off my credit card?"
    ];
    
    const randomQuery = voiceQueries[Math.floor(Math.random() * voiceQueries.length)];
    
    try {
      const financialData: FinancialData = {
        income: dashboardData.profile.monthlyIncome,
        expenses: dashboardData.budgets.reduce((acc, budget) => ({
          ...acc,
          [budget.category]: budget.spent
        }), {} as Record<string, number>),
        savings: dashboardData.accounts.find(acc => acc.type === 'savings')?.balance || 0,
        goal: userGoal,
        riskProfile: dashboardData.profile.riskProfile
      };
      
      const aiText = await getFinancialAdvice(randomQuery, financialData);
      setAiResponse(`
        <div class="text-left space-y-4">
          <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <i class="fas fa-microphone text-white text-sm"></i>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-800">Voice Query</p>
              <p class="text-sm text-blue-600">"${randomQuery}"</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-white text-sm"></i>
            </div>
            <div>
              <p class="text-sm font-medium text-purple-800">AI Financial Advisor</p>
            </div>
          </div>
          
          <div class="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg">
            ${aiText.replace(/\n/g, '<br>')}
          </div>
          
          <div class="flex flex-wrap gap-2 pt-2">
            <button class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center">
              <i class="fas fa-thumbs-up mr-2"></i>Helpful
            </button>
            <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors flex items-center">
              <i class="fas fa-question mr-2"></i>Ask Follow-up
            </button>
          </div>
        </div>
      `);
      setIsListening(false);
    } catch (error) {
      console.error('Error with voice query:', error);
      setAiResponse('Sorry, I encountered an error. Please try again.');
      setIsListening(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useImperativeHandle(ref, () => ({
    startListening
  }));

  // Complete challenge function with API call
  const completeChallenge = async (challengeId: string) => {
    try {
      const response = await fetch('/api/challenges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, userId: 'demo-user' })
      });
      
      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        setPoints(prev => prev + 100); // Award points
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  // Refresh data function
  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate total balance from accounts
  const totalBalance = dashboardData?.accounts.reduce((sum, account) => sum + account.balance, 0) || 0;
  
  // Calculate monthly spending from budgets
  const monthlySpending = dashboardData?.budgets.reduce((sum, budget) => sum + budget.spent, 0) || 0;
  
  // Get primary goal
  const primaryGoal = dashboardData?.goals.find(goal => goal.priority === 'High') || dashboardData?.goals[0];
  
  // Get investment account
  const investmentAccount = dashboardData?.accounts.find(acc => acc.type === 'investment');

  if (isDataLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-lg font-medium text-gray-600">Loading your financial dashboard...</p>
            <p className="text-sm text-gray-500">Analyzing your financial data</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-6xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Unable to load dashboard</h3>
          <p className="text-gray-500 mb-4">There was an error loading your financial data.</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Quick action functions
  const connectBank = () => {
    alert('Bank connection feature - In production, this would integrate with Plaid or similar APIs');
  };

  const setBudget = () => {
    alert('Budget setting feature - In production, this would open a budget configuration modal');
  };

  const investmentAdvice = () => {
    setAiInput('What are some good investment opportunities for my risk profile?');
    askAI();
  };

  const exportData = () => {
    // In production, this would generate and download a CSV/PDF report
    const data = {
      user: dashboardData?.name,
      totalBalance: totalBalance,
      monthlySpending: monthlySpending,
      goals: dashboardData?.goals.map(g => ({
        title: g.title,
        progress: `${Math.round((g.currentAmount / g.targetAmount) * 100)}%`,
        target: g.targetAmount
      })),
      exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "financial-report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold mb-2">Welcome back, {dashboardData.name}!</h1>
          <p className="text-primary-100">Here&apos;s your financial overview for today</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={refreshData}
            className={`p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 ${refreshing ? 'animate-spin' : ''}`}
          >
            <FontAwesomeIcon icon={faSync} className="text-white" />
          </button>
          <div className="text-right">
            <p className="text-sm text-primary-100">Total Points</p>
            <p className="text-xl font-bold flex items-center">
              <FontAwesomeIcon icon={faStar} className="text-yellow-300 mr-1" />
              {points}
            </p>
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <div className={`card mb-8 relative border-l-4 border-primary-500 overflow-hidden ${showAiPanel ? '' : 'hidden'}`}>
        <div className="absolute top-0 left-0 w-full h-1 gradient-bg"></div>
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center mr-4 shadow-lg">
            <FontAwesomeIcon icon={faRobot} className="text-white text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-800">AI Financial Advisor</h3>
            <p className="text-gray-600 text-sm">Ask me anything about your finances</p>
          </div>
        </div>
        <div 
          id="aiResponse" 
          className="bg-slate-50 rounded-lg p-4 mb-4 min-h-[100px] flex items-center justify-center text-gray-500"
        >
          {isLoading ? (
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} spin className="text-3xl mb-2 text-primary-500" />
              <p>Processing your request...</p>
            </div>
          ) : aiResponse ? (
            <div dangerouslySetInnerHTML={{ __html: aiResponse }} />
          ) : (
            <div className="text-center">
              <FontAwesomeIcon icon={faMicrophoneAlt} className="text-3xl mb-2 pulse-animation text-primary-500" />
              <p>Listening... Ask me about your budget, savings, or investments</p>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <input 
            type="text" 
            id="aiInput" 
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Type your question here..." 
            className="input flex-1 rounded-r-none focus:z-10"
          />
          <button 
            onClick={askAI} 
            className="btn btn-primary rounded-l-none"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Total Balance</h3>
            <FontAwesomeIcon icon={faWallet} className="text-green-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-800">${totalBalance.toFixed(2)}</p>
          <p className="text-green-500 text-sm mt-2">+5.2% from last month</p>
        </div>

        {/* Monthly Spending */}
        <div className="card card-hover border-t-4 border-danger-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Monthly Spending</h3>
            <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faCreditCard} className="text-danger-600" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-gray-800">${monthlySpending.toFixed(2)}</p>
          <div className="flex items-center text-sm">
            <span className="badge badge-danger">+$340</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
        
        {/* Savings Goal */}
        <div className="card card-hover border-t-4 border-success-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{userGoal.description || 'Emergency Fund'}</h3>
            <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faPiggyBank} className="text-success-600" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-gray-800">${primaryGoal ? primaryGoal.currentAmount.toFixed(2) : '0.00'}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
            <div className="bg-success-500 h-2.5 rounded-full progress-bar" style={{ width: primaryGoal ? `${(primaryGoal.currentAmount / primaryGoal.targetAmount) * 100}%` : '0%' }}></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">${primaryGoal ? primaryGoal.targetAmount.toFixed(2) : '0.00'} target</span>
            <span className="badge badge-success">{primaryGoal ? `${Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)}%` : '0%'}</span>
          </div>
        </div>
        
        {/* Investment Portfolio */}
        <div className="card card-hover border-t-4 border-secondary-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Investments</h3>
            <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faChartLine} className="text-secondary-600" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-gray-800">${investmentAccount ? investmentAccount.balance.toFixed(2) : '0.00'}</p>
          <div className="flex items-center text-sm">
            <span className="badge badge-secondary">+8.4%</span>
            <span className="text-gray-500 ml-2">this month</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending Analysis */}
        <div className="lg:col-span-2 card card-hover">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <FontAwesomeIcon icon={faChartPie} className="text-primary-500 mr-2" />
              Spending Analysis
            </h3>
            <select className="input py-1 px-3 text-sm">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          <canvas ref={spendingChartRef} width="400" height="200"></canvas>
        </div>

        {/* Smart Alerts */}
        <div className="card card-hover">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <FontAwesomeIcon icon={faBell} className="text-primary-500 mr-2" />
              Smart Alerts
            </h3>
            <span className="badge badge-danger">3 New</span>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-4 border-danger-500 bg-danger-50 p-4 rounded-lg shadow-sm hover:shadow transition-all duration-300">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-danger-800">Dining budget exceeded</h4>
                  <p className="text-sm text-danger-700 mt-1">You&apos;re 12% over your dining budget this month</p>
                </div>
              </div>
            </div>
            <div className="border-l-4 border-secondary-500 bg-secondary-50 p-4 rounded-lg shadow-sm hover:shadow transition-all duration-300">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faLightbulb} className="text-secondary-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-secondary-800">Investment Opportunity</h4>
                  <p className="text-sm text-secondary-700 mt-1">Tech stocks are down 3% - good buying opportunity</p>
                </div>
              </div>
            </div>
            <div className="border-l-4 border-success-500 bg-success-50 p-4 rounded-lg shadow-sm hover:shadow transition-all duration-300">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-success-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-success-800">Goal Achievement</h4>
                  <p className="text-sm text-success-700 mt-1">You&apos;re on track to reach your emergency fund goal!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gamified Savings Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card card-hover border-l-4 border-warning-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <FontAwesomeIcon icon={faTrophy} className="text-warning-500 mr-2" />
              Gamified Savings Challenges
            </h3>
            <div className="flex items-center space-x-1 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-semibold">
              <FontAwesomeIcon icon={faStar} className="text-warning-500" />
              <span>{points} points</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {dashboardData.challenges.map((challenge) => (
              <div key={challenge.id} className="p-4 bg-slate-50 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center mr-3">
                      <FontAwesomeIcon icon={challenge.category === 'coffee' ? faCoffee : faUtensils} className="text-warning-600" />
                    </div>
                    <span className="font-medium text-gray-800">{challenge.title}</span>
                  </div>
                  <button 
                    onClick={() => completeChallenge(challenge.id)}
                    className="btn-outline-success text-xs px-3 py-1 rounded-full">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                    Mark Complete
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-warning-500 h-2.5 rounded-full progress-bar" 
                    style={{ width: `${(challenge.currentDays / challenge.targetDays) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="badge badge-warning">{challenge.currentDays}/{challenge.targetDays} days</span>
                  <span className="badge badge-success">${challenge.currentAmount} saved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="card card-hover">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <FontAwesomeIcon icon={faBolt} className="text-primary-500 mr-2" />
              Quick Actions
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={connectBank}
              className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faUniversity} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Connect Bank</span>
            </button>
            
            <button 
              onClick={setBudget}
              className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full gradient-success flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faCalculator} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Set Budget</span>
            </button>
            
            <button 
              onClick={investmentAdvice}
              className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faChartPie} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Investment Tips</span>
            </button>
            
            <button 
              onClick={exportData}
              className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full gradient-warning flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faDownload} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Export Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;