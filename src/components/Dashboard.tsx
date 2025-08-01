'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faCreditCard, faPiggyBank, faChartLine, faExclamationTriangle,
  faLightbulb, faCheckCircle, faCoffee, faUtensils, faUniversity,
  faCalculator, faChartPie, faDownload, faRobot, faPaperPlane,
  faMicrophoneAlt, faSpinner, faTrophy, faBell, faStar, faBolt,
  faSync, faArrowUp, faArrowDown, faTrendUp, faEye, faEyeSlash,
  faExpand, faCompress, faFilter, faCalendarAlt
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
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  
  const spendingChartRef = useRef<HTMLCanvasElement | null>(null);
  const spendingChartInstance = useRef<Chart | null>(null);
  const goalsChartRef = useRef<HTMLCanvasElement | null>(null);
  const goalsChartInstance = useRef<Chart | null>(null);
  const trendChartRef = useRef<HTMLCanvasElement | null>(null);
  const trendChartInstance = useRef<Chart | null>(null);
  const savingsChartRef = useRef<HTMLCanvasElement | null>(null);
  const savingsChartInstance = useRef<Chart | null>(null);

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

  // Initialize spending chart with better sizing and styling
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
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Budget',
            data: budgetData,
            backgroundColor: 'rgba(156, 163, 175, 0.4)',
            borderColor: 'rgba(156, 163, 175, 0.8)',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11,
                weight: '500'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(14, 165, 233, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
              drawBorder: false
            },
            ticks: {
              callback: function(value) {
                return '$' + Number(value).toFixed(0);
              },
              font: {
                size: 10
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
  }, [dashboardData]);

  // Initialize goals progress chart
  const initializeGoalsChart = useCallback(() => {
    if (!goalsChartRef.current || !dashboardData) return;
    
    const ctx = goalsChartRef.current.getContext('2d');
    if (!ctx) return;

    if (goalsChartInstance.current) {
      goalsChartInstance.current.destroy();
    }

    const goalLabels = dashboardData.goals.map(g => g.title.length > 15 ? g.title.substring(0, 15) + '...' : g.title);
    const progressData = dashboardData.goals.map(g => (g.currentAmount / g.targetAmount) * 100);
    
    goalsChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: goalLabels,
        datasets: [{
          data: progressData,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(236, 72, 153, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(59, 130, 246, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.toFixed(1)}%`;
              }
            }
          }
        }
      }
    });
  }, [dashboardData]);

  // Initialize trend chart
  const initializeTrendChart = useCallback(() => {
    if (!trendChartRef.current || !dashboardData) return;
    
    const ctx = trendChartRef.current.getContext('2d');
    if (!ctx) return;

    if (trendChartInstance.current) {
      trendChartInstance.current.destroy();
    }

    // Generate sample trend data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const incomeData = [5200, 5400, 5300, 5600, 5500, 5800];
    const expenseData = [3200, 3400, 3100, 3300, 3500, 3200];
    const savingsData = incomeData.map((income, i) => income - expenseData[i]);
    
    trendChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Net Savings',
            data: savingsData,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11,
                weight: '500'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(59, 130, 246, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: $${context.parsed.y.toFixed(0)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
              drawBorder: false
            },
            ticks: {
              callback: function(value) {
                return '$' + Number(value).toFixed(0);
              },
              font: {
                size: 10
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
              drawBorder: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
  }, [dashboardData]);

  // Initialize savings breakdown chart
  const initializeSavingsChart = useCallback(() => {
    if (!savingsChartRef.current || !dashboardData) return;
    
    const ctx = savingsChartRef.current.getContext('2d');
    if (!ctx) return;

    if (savingsChartInstance.current) {
      savingsChartInstance.current.destroy();
    }

    const accounts = dashboardData.accounts.filter(acc => acc.type !== 'checking');
    const labels = accounts.map(acc => acc.name);
    const data = accounts.map(acc => acc.balance);
    
    savingsChartInstance.current = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(168, 85, 247, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(59, 130, 246, 0.7)'
          ],
          borderColor: [
            'rgba(168, 85, 247, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(59, 130, 246, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(168, 85, 247, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return `${context.label}: $${context.parsed.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.2)'
            },
            ticks: {
              display: false
            }
          }
        }
      }
    });
  }, [dashboardData]);

  // Initialize all charts
  useEffect(() => {
    if (dashboardData) {
      initializeSpendingChart();
      initializeGoalsChart();
      initializeTrendChart();
      initializeSavingsChart();
    }
  }, [dashboardData, initializeSpendingChart, initializeGoalsChart, initializeTrendChart, initializeSavingsChart]);

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

  const toggleChartExpansion = (chartName: string) => {
    setExpandedChart(expandedChart === chartName ? null : chartName);
  };

  const formatCurrency = (amount: number, hideValue = false) => {
    if (hideValue) return '****';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

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
      {/* Enhanced Welcome Header with Privacy Toggle */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              Welcome back, {dashboardData.name}!
            </h1>
            <p className="text-purple-100 text-lg">Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 backdrop-blur-sm"
              title={hideBalance ? 'Show balance' : 'Hide balance'}
            >
              <FontAwesomeIcon icon={hideBalance ? faEyeSlash : faEye} className="text-white text-lg" />
            </button>
            <button 
              onClick={refreshData}
              className={`p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 backdrop-blur-sm ${refreshing ? 'animate-spin' : ''}`}
            >
              <FontAwesomeIcon icon={faSync} className="text-white text-lg" />
            </button>
            <div className="text-right bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-sm text-purple-100">Total Points</p>
              <p className="text-2xl font-bold flex items-center">
                <FontAwesomeIcon icon={faStar} className="text-yellow-300 mr-2" />
                {points}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg p-2">
        <div className="flex space-x-2">
          {[
            { id: 'overview', label: 'Overview', icon: faChartPie },
            { id: 'spending', label: 'Spending', icon: faCreditCard },
            { id: 'goals', label: 'Goals', icon: faTrophy },
            { id: 'trends', label: 'Trends', icon: faTrendUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced AI Assistant Panel */}
      <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-6 shadow-xl ${showAiPanel ? '' : 'hidden'}`}>
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
            <FontAwesomeIcon icon={faRobot} className="text-white text-2xl" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-800">AI Financial Advisor</h3>
            <p className="text-gray-600">Your personalized finance assistant</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 mb-4 min-h-[150px] shadow-inner border border-purple-100">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg font-medium text-purple-600">Analyzing your finances...</span>
              </div>
            </div>
          ) : aiResponse ? (
            <div dangerouslySetInnerHTML={{ __html: aiResponse }} />
          ) : (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faMicrophoneAlt} className="text-5xl mb-4 text-purple-400" />
              <p className="text-lg text-gray-600">Ready to help with your financial questions!</p>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <input 
            type="text" 
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Ask about your budget, investments, or financial goals..." 
            className="flex-1 p-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            onKeyPress={(e) => e.key === 'Enter' && askAI()}
          />
          <button 
            onClick={askAI} 
            className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>

      {/* Enhanced Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faWallet} className="text-white text-xl" />
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <FontAwesomeIcon icon={faArrowUp} className="text-sm" />
              <span className="text-sm font-medium">+5.2%</span>
            </div>
          </div>
          <h3 className="text-green-700 font-semibold mb-2">Total Balance</h3>
          <p className="text-3xl font-bold text-green-800 mb-1">
            {formatCurrency(totalBalance, hideBalance)}
          </p>
          <p className="text-green-600 text-sm">from last month</p>
        </div>

        {/* Monthly Spending Card */}
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl p-6 border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faCreditCard} className="text-white text-xl" />
            </div>
            <div className="flex items-center space-x-2 text-red-600">
              <FontAwesomeIcon icon={faArrowUp} className="text-sm" />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <h3 className="text-red-700 font-semibold mb-2">Monthly Spending</h3>
          <p className="text-3xl font-bold text-red-800 mb-1">
            {formatCurrency(monthlySpending, hideBalance)}
          </p>
          <p className="text-red-600 text-sm">vs budget limit</p>
        </div>
        
        {/* Savings Goal Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faPiggyBank} className="text-white text-xl" />
            </div>
            <div className="text-blue-600 text-sm font-medium">
              {primaryGoal ? `${Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)}%` : '0%'}
            </div>
          </div>
          <h3 className="text-blue-700 font-semibold mb-2">{userGoal.description || 'Emergency Fund'}</h3>
          <p className="text-3xl font-bold text-blue-800 mb-2">
            {formatCurrency(primaryGoal ? primaryGoal.currentAmount : 0, hideBalance)}
          </p>
          <div className="w-full bg-blue-200 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: primaryGoal ? `${(primaryGoal.currentAmount / primaryGoal.targetAmount) * 100}%` : '0%' }}
            ></div>
          </div>
          <p className="text-blue-600 text-sm">
            {formatCurrency(primaryGoal ? primaryGoal.targetAmount : 0, hideBalance)} target
          </p>
        </div>
        
        {/* Investment Portfolio Card */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <FontAwesomeIcon icon={faArrowUp} className="text-sm" />
              <span className="text-sm font-medium">+8.4%</span>
            </div>
          </div>
          <h3 className="text-purple-700 font-semibold mb-2">Investments</h3>
          <p className="text-3xl font-bold text-purple-800 mb-1">
            {formatCurrency(investmentAccount ? investmentAccount.balance : 0, hideBalance)}
          </p>
          <p className="text-purple-600 text-sm">this month</p>
        </div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Spending Analysis Chart */}
        <div className={`bg-white rounded-3xl shadow-xl p-6 border border-gray-100 transition-all duration-300 ${expandedChart === 'spending' ? 'xl:col-span-3' : 'xl:col-span-2'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faChartPie} className="text-indigo-500 mr-3" />
              Spending Analysis
            </h3>
            <div className="flex items-center space-x-3">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button 
                onClick={() => toggleChartExpansion('spending')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={expandedChart === 'spending' ? faCompress : faExpand} className="text-gray-600" />
              </button>
            </div>
          </div>
          <div style={{ height: expandedChart === 'spending' ? '400px' : '280px' }}>
            <canvas ref={spendingChartRef}></canvas>
          </div>
        </div>

        {/* Goals Progress Chart */}
        <div className={`bg-white rounded-3xl shadow-xl p-6 border border-gray-100 transition-all duration-300 ${expandedChart === 'goals' ? 'xl:col-span-3' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 mr-3" />
              Goals Progress
            </h3>
            <button 
              onClick={() => toggleChartExpansion('goals')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={expandedChart === 'goals' ? faCompress : faExpand} className="text-gray-600" />
            </button>
          </div>
          <div style={{ height: expandedChart === 'goals' ? '400px' : '280px' }}>
            <canvas ref={goalsChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Financial Trends Chart */}
        <div className={`bg-white rounded-3xl shadow-xl p-6 border border-gray-100 transition-all duration-300 ${expandedChart === 'trends' ? 'xl:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faTrendUp} className="text-green-500 mr-3" />
              Financial Trends
            </h3>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button className="px-3 py-1 text-xs font-medium bg-white rounded-md shadow-sm">6M</button>
                <button className="px-3 py-1 text-xs font-medium text-gray-600">1Y</button>
                <button className="px-3 py-1 text-xs font-medium text-gray-600">All</button>
              </div>
              <button 
                onClick={() => toggleChartExpansion('trends')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={expandedChart === 'trends' ? faCompress : faExpand} className="text-gray-600" />
              </button>
            </div>
          </div>
          <div style={{ height: expandedChart === 'trends' ? '400px' : '300px' }}>
            <canvas ref={trendChartRef}></canvas>
          </div>
        </div>

        {/* Savings Breakdown Chart */}
        <div className={`bg-white rounded-3xl shadow-xl p-6 border border-gray-100 transition-all duration-300 ${expandedChart === 'savings' ? 'xl:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faPiggyBank} className="text-purple-500 mr-3" />
              Savings Breakdown
            </h3>
            <button 
              onClick={() => toggleChartExpansion('savings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={expandedChart === 'savings' ? faCompress : faExpand} className="text-gray-600" />
            </button>
          </div>
          <div style={{ height: expandedChart === 'savings' ? '400px' : '300px' }}>
            <canvas ref={savingsChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Enhanced Smart Alerts */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <FontAwesomeIcon icon={faBell} className="text-orange-500 mr-3" />
            Smart Financial Insights
          </h3>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">3 New</span>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FontAwesomeIcon icon={faFilter} className="text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Budget Alert</h4>
                <p className="text-red-700 text-sm mb-3">You're 12% over your dining budget this month</p>
                <button className="text-red-600 text-xs font-medium hover:text-red-800 transition-colors">
                  View Details →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faLightbulb} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Investment Tip</h4>
                <p className="text-blue-700 text-sm mb-3">Tech stocks down 3% - potential buying opportunity</p>
                <button className="text-blue-600 text-xs font-medium hover:text-blue-800 transition-colors">
                  Learn More →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-2">Goal Progress</h4>
                <p className="text-green-700 text-sm mb-3">On track to reach emergency fund goal by December!</p>
                <button className="text-green-600 text-xs font-medium hover:text-green-800 transition-colors">
                  View Progress →
                </button>
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faChartLine} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Investment Tips</span>
            </button>
            
            <button 
              onClick={exportData}
              className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faDownload} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Export Data</span>
            </button>
            
            <button 
              onClick={() => setShowAiPanel(true)}
              className="flex flex-col items-center justify-center bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md border border-purple-200">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faRobot} className="text-white" />
              </div>
              <span className="text-sm font-medium text-purple-800">Ask AI</span>
            </button>
            
            <button 
              onClick={startListening}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 hover:shadow-md ${
                isListening 
                  ? 'bg-gradient-to-r from-red-100 to-pink-100 border border-red-300' 
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:from-green-100 hover:to-emerald-100'
              }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md ${
                isListening 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 animate-pulse' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600'
              }`}>
                <FontAwesomeIcon 
                  icon={isListening ? faSpinner : faMicrophoneAlt} 
                  className={`text-white ${isListening ? 'animate-spin' : ''}`} 
                />
              </div>
              <span className={`text-sm font-medium ${isListening ? 'text-red-800' : 'text-green-800'}`}>
                {isListening ? 'Listening...' : 'Voice Ask'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Recent Transactions */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 mr-3" />
            Recent Transactions
          </h3>
          <div className="flex items-center space-x-3">
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Categories</option>
              <option>Food & Dining</option>
              <option>Transportation</option>
              <option>Shopping</option>
              <option>Entertainment</option>
            </select>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
              View All
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {dashboardData.expenses.slice(0, 5).map((expense, index) => (
            <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  expense.category === 'food' ? 'bg-orange-100' :
                  expense.category === 'transport' ? 'bg-blue-100' :
                  expense.category === 'shopping' ? 'bg-purple-100' :
                  'bg-green-100'
                }`}>
                  <FontAwesomeIcon 
                    icon={
                      expense.category === 'food' ? faUtensils :
                      expense.category === 'transport' ? faCar :
                      expense.category === 'shopping' ? faBag :
                      faCoffee
                    } 
                    className={`${
                      expense.category === 'food' ? 'text-orange-600' :
                      expense.category === 'transport' ? 'text-blue-600' :
                      expense.category === 'shopping' ? 'text-purple-600' :
                      'text-green-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {expense.description || `${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} Purchase`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">
                  -{formatCurrency(expense.amount, hideBalance)}
                </p>
                <p className="text-xs text-gray-500 capitalize">{expense.category}</p>
              </div>
            </div>
          ))}
          
          {dashboardData.expenses.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl text-gray-300 mb-4" />
              <p className="text-gray-500">No recent transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Financial Health Score */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">Financial Health Score</h3>
            <p className="text-purple-100">Based on your spending, saving, and investment patterns</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-2">85</div>
            <div className="text-purple-100">Excellent</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-100">Budgeting</span>
              <span className="text-green-300 font-bold">92%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-100">Saving</span>
              <span className="text-yellow-300 font-bold">78%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-100">Investing</span>
              <span className="text-blue-300 font-bold">85%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-100">Debt Management</span>
              <span className="text-green-300 font-bold">88%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: '88%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl backdrop-blur-sm transition-all duration-300 font-medium">
            View Detailed Report
          </button>
          <button className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-xl transition-all duration-300 font-medium">
            Get Improvement Tips
          </button>
        </div>
      </div>

      {/* Floating Action Button for AI */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowAiPanel(!showAiPanel)}
          className={`w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${
            showAiPanel
              ? 'bg-gradient-to-r from-red-500 to-pink-600 rotate-45'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-purple-500/25'
          }`}
        >
          <FontAwesomeIcon 
            icon={showAiPanel ? faClose : faRobot} 
            className="text-white text-xl" 
          />
        </button>
      </div>

      {/* Loading Overlay */}
      {(isLoading || refreshing) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-gray-700">
              {refreshing ? 'Refreshing data...' : 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;