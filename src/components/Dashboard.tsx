'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faCreditCard, faPiggyBank, faChartLine, faExclamationTriangle,
  faLightbulb, faCheckCircle, faCoffee, faUtensils, faUniversity,
  faCalculator, faChartPie, faDownload, faRobot, faPaperPlane,
  faMicrophoneAlt, faSpinner, faTrophy, faBell, faStar, faBolt,
  faSync, faArrowUp, faEye, faEyeSlash,
  faExpand, faCompress, faFilter, faCalendarAlt, faCar, faShoppingBag, faTimes
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
                weight: 500
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
              color: 'rgba(156, 163, 175, 0.1)'
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
                weight: 500
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
              color: 'rgba(156, 163, 175, 0.1)'
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
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
              font: {
                size: 11,
                weight: 500
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
                const value = typeof context.parsed === 'number' ? context.parsed : 
                             context.parsed && typeof context.parsed === 'object' ? 
                             (context.parsed as { r?: number }).r || 0 : 0;
                return `${context.label}: $${value.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 space-y-8 relative z-10">
        {/* Enhanced Welcome Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent animate-fade-in">
                  Welcome back, {dashboardData?.name || 'Demo User'}!
                </h1>
                <p className="text-purple-100 text-lg opacity-90 animate-slide-up">
                  Here&apos;s your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center space-x-6">
                <button 
                  onClick={() => setHideBalance(!hideBalance)}
                  className="group p-4 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 transform"
                  title={hideBalance ? 'Show balance' : 'Hide balance'}
                >
                  <FontAwesomeIcon icon={hideBalance ? faEyeSlash : faEye} className="text-white text-lg group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={refreshData}
                  className={`group p-4 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 transform ${refreshing ? 'animate-spin' : ''}`}
                >
                  <FontAwesomeIcon icon={faSync} className="text-white text-lg group-hover:scale-110 transition-transform" />
                </button>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm animate-pulse"></div>
                  <div className="relative text-right bg-white/20 rounded-2xl p-6 backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-105 transform">
                    <p className="text-sm text-purple-100 mb-1">Total Points</p>
                    <p className="text-3xl font-bold flex items-center justify-center">
                      <FontAwesomeIcon icon={faStar} className="text-yellow-300 mr-2 animate-pulse" />
                      <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">{points}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation with Glassmorphism */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/20"></div>
          <div className="relative p-3">
            <div className="flex space-x-2">
              {[
                { id: 'overview', label: 'Overview', icon: faChartPie },
                { id: 'spending', label: 'Spending', icon: faCreditCard },
                { id: 'goals', label: 'Goals', icon: faTrophy },
                { id: 'trends', label: 'Trends', icon: faChartLine }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center space-x-3 px-8 py-4 rounded-2xl font-medium transition-all duration-500 transform hover:scale-105 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/25 scale-105'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-800 backdrop-blur-sm'
                  }`}
                >
                  <FontAwesomeIcon 
                    icon={tab.icon} 
                    className={`transition-transform duration-300 group-hover:scale-110 ${
                      activeTab === tab.id ? 'animate-pulse' : ''
                    }`} 
                  />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced AI Assistant Panel with Glassmorphism */}
        <div className={`relative transition-all duration-700 transform ${showAiPanel ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 hidden'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-indigo-400/20 to-blue-400/20 backdrop-blur-2xl rounded-3xl border border-white/30"></div>
          <div className="relative p-8 shadow-2xl">
            <div className="flex items-center mb-8">
              <div className="relative mr-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
                  <FontAwesomeIcon icon={faRobot} className="text-white text-2xl animate-bounce" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-2xl text-gray-800 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Financial Advisor
                </h3>
                <p className="text-gray-600 text-lg">Your personalized finance assistant powered by AI</p>
              </div>
              <button 
                onClick={() => setShowAiPanel(false)}
                className="ml-auto p-3 hover:bg-white/30 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110 transform"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
              </button>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40"></div>
              <div className="relative p-8 min-h-[200px] shadow-inner">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin animate-reverse"></div>
                    </div>
                    <span className="ml-4 text-xl font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Analyzing your finances...
                    </span>
                  </div>
                ) : aiResponse ? (
                  <div className="animate-fade-in" dangerouslySetInnerHTML={{ __html: aiResponse }} />
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-2xl animate-pulse"></div>
                      <FontAwesomeIcon icon={faMicrophoneAlt} className="relative text-6xl text-purple-500 animate-bounce" />
                    </div>
                    <p className="text-xl text-gray-700 font-medium">Ready to help with your financial questions!</p>
                    <p className="text-gray-500 mt-2">Ask me about budgeting, investments, or saving strategies</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask about your budget, investments, or financial goals..." 
                  className="w-full p-5 bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl focus:ring-4 focus:ring-purple-500/25 focus:border-purple-500/50 transition-all duration-300 text-gray-800 placeholder-gray-500 shadow-inner"
                  onKeyPress={(e) => e.key === 'Enter' && askAI()}
                />
              </div>
              <button 
                onClick={askAI} 
                disabled={isLoading}
                className="group px-8 py-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-2xl shadow-purple-500/25 hover:scale-110 transform disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-purple-500/40"
              >
                <FontAwesomeIcon 
                  icon={isLoading ? faSpinner : faPaperPlane} 
                  className={`text-lg ${isLoading ? 'animate-spin' : 'group-hover:translate-x-1 transition-transform'}`} 
                />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Financial Overview Cards with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {/* Total Balance Card */}
          <div className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-105 transform">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-emerald-400/30 to-teal-400/20 backdrop-blur-2xl border border-green-200/30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 to-emerald-100/40"></div>
            <div className="relative p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faWallet} className="text-white text-2xl" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-xl border border-green-500/30">
                  <FontAwesomeIcon icon={faArrowUp} className="text-green-600 text-sm animate-bounce" />
                  <span className="text-sm font-bold text-green-700">+5.2%</span>
                </div>
              </div>
              <h3 className="text-green-700 font-bold text-lg mb-3">Total Balance</h3>
              <p className="text-4xl font-black text-green-800 mb-2 bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                {formatCurrency(totalBalance, hideBalance)}
              </p>
              <p className="text-green-600 text-sm font-medium">from last month</p>
            </div>
          </div>

          {/* Monthly Spending Card */}
          <div className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-105 transform">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 via-rose-400/30 to-pink-400/20 backdrop-blur-2xl border border-red-200/30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 to-rose-100/40"></div>
            <div className="relative p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faCreditCard} className="text-white text-2xl" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-500/30">
                  <FontAwesomeIcon icon={faArrowUp} className="text-red-600 text-sm animate-bounce" />
                  <span className="text-sm font-bold text-red-700">+12%</span>
                </div>
              </div>
              <h3 className="text-red-700 font-bold text-lg mb-3">Monthly Spending</h3>
              <p className="text-4xl font-black text-red-800 mb-2 bg-gradient-to-r from-red-700 to-rose-700 bg-clip-text text-transparent">
                {formatCurrency(monthlySpending, hideBalance)}
              </p>
              <p className="text-red-600 text-sm font-medium">vs budget limit</p>
            </div>
          </div>
          
          {/* Savings Goal Card */}
          <div className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-105 transform">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-indigo-400/30 to-cyan-400/20 backdrop-blur-2xl border border-blue-200/30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-indigo-100/40"></div>
            <div className="relative p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faPiggyBank} className="text-white text-2xl" />
                  </div>
                </div>
                <div className="px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-500/30">
                  <span className="text-sm font-bold text-blue-700">
                    {primaryGoal ? `${Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
              <h3 className="text-blue-700 font-bold text-lg mb-3">{userGoal.description || 'Emergency Fund'}</h3>
              <p className="text-4xl font-black text-blue-800 mb-4 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                {formatCurrency(primaryGoal ? primaryGoal.currentAmount : 0, hideBalance)}
              </p>
              <div className="relative w-full bg-blue-200/50 rounded-full h-4 mb-3 overflow-hidden backdrop-blur-sm">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg" 
                  style={{ width: primaryGoal ? `${(primaryGoal.currentAmount / primaryGoal.targetAmount) * 100}%` : '0%' }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
              <p className="text-blue-600 text-sm font-medium">
                {formatCurrency(primaryGoal ? primaryGoal.targetAmount : 0, hideBalance)} target
              </p>
            </div>
          </div>
          
          {/* Investment Portfolio Card */}
          <div className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-105 transform">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-violet-400/30 to-fuchsia-400/20 backdrop-blur-2xl border border-purple-200/30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-violet-100/40"></div>
            <div className="relative p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faChartLine} className="text-white text-2xl" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-xl border border-purple-500/30">
                  <FontAwesomeIcon icon={faArrowUp} className="text-purple-600 text-sm animate-bounce" />
                  <span className="text-sm font-bold text-purple-700">+8.4%</span>
                </div>
              </div>
              <h3 className="text-purple-700 font-bold text-lg mb-3">Investments</h3>
              <p className="text-4xl font-black text-purple-800 mb-2 bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
                {formatCurrency(investmentAccount ? investmentAccount.balance : 0, hideBalance)}
              </p>
              <p className="text-purple-600 text-sm font-medium">this month</p>
            </div>
          </div>
        </div>

        {/* Enhanced Charts Section with Glassmorphism */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Spending Analysis Chart */}
          <div className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] transform ${expandedChart === 'spending' ? 'xl:col-span-3' : 'xl:col-span-2'}`}>
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faChartPie} className="text-white text-lg" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Spending Analysis
                  </span>
                </h3>
                <div className="flex items-center space-x-4">
                  <select 
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="px-6 py-3 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/25 focus:border-indigo-500/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                  <button 
                    onClick={() => toggleChartExpansion('spending')}
                    className="p-3 bg-white/80 backdrop-blur-xl hover:bg-white/90 rounded-xl transition-all duration-300 border border-gray-200/50 hover:scale-110 transform shadow-lg hover:shadow-xl"
                  >
                    <FontAwesomeIcon icon={expandedChart === 'spending' ? faCompress : faExpand} className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl backdrop-blur-sm"></div>
                <div className="relative" style={{ height: expandedChart === 'spending' ? '400px' : '300px' }}>
                  <canvas ref={spendingChartRef}></canvas>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Progress Chart */}
          <div className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] transform ${expandedChart === 'goals' ? 'xl:col-span-3' : ''}`}>
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faTrophy} className="text-white text-lg" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Goals Progress
                  </span>
                </h3>
                <button 
                  onClick={() => toggleChartExpansion('goals')}
                  className="p-3 bg-white/80 backdrop-blur-xl hover:bg-white/90 rounded-xl transition-all duration-300 border border-gray-200/50 hover:scale-110 transform shadow-lg hover:shadow-xl"
                >
                  <FontAwesomeIcon icon={expandedChart === 'goals' ? faCompress : faExpand} className="text-gray-600" />
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 rounded-2xl backdrop-blur-sm"></div>
                <div className="relative" style={{ height: expandedChart === 'goals' ? '400px' : '300px' }}>
                  <canvas ref={goalsChartRef}></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Charts Row with Glassmorphism */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Financial Trends Chart */}
          <div className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] transform ${expandedChart === 'trends' ? 'xl:col-span-2' : ''}`}>
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faChartLine} className="text-white text-lg" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Financial Trends
                  </span>
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-xl rounded-xl p-2 border border-gray-200/50 shadow-lg">
                    <button className="px-4 py-2 text-sm font-medium bg-white rounded-lg shadow-sm hover:scale-105 transform transition-all duration-200">6M</button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200">1Y</button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200">All</button>
                  </div>
                  <button 
                    onClick={() => toggleChartExpansion('trends')}
                    className="p-3 bg-white/80 backdrop-blur-xl hover:bg-white/90 rounded-xl transition-all duration-300 border border-gray-200/50 hover:scale-110 transform shadow-lg hover:shadow-xl"
                  >
                    <FontAwesomeIcon icon={expandedChart === 'trends' ? faCompress : faExpand} className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-2xl backdrop-blur-sm"></div>
                <div className="relative" style={{ height: expandedChart === 'trends' ? '400px' : '320px' }}>
                  <canvas ref={trendChartRef}></canvas>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Breakdown Chart */}
          <div className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] transform ${expandedChart === 'savings' ? 'xl:col-span-2' : ''}`}>
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faPiggyBank} className="text-white text-lg" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    Savings Breakdown
                  </span>
                </h3>
                <button 
                  onClick={() => toggleChartExpansion('savings')}
                  className="p-3 bg-white/80 backdrop-blur-xl hover:bg-white/90 rounded-xl transition-all duration-300 border border-gray-200/50 hover:scale-110 transform shadow-lg hover:shadow-xl"
                >
                  <FontAwesomeIcon icon={expandedChart === 'savings' ? faCompress : faExpand} className="text-gray-600" />
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-violet-50/50 rounded-2xl backdrop-blur-sm"></div>
                <div className="relative" style={{ height: expandedChart === 'savings' ? '400px' : '320px' }}>
                  <canvas ref={savingsChartRef}></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Smart Alerts with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.01] transform">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <FontAwesomeIcon icon={faBell} className="text-white text-lg animate-pulse" />
                </div>
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Smart Financial Insights
                </span>
              </h3>
              <div className="flex items-center space-x-4">
                <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg animate-pulse">
                  3 New
                </span>
                <button className="p-3 bg-white/80 backdrop-blur-xl hover:bg-white/90 rounded-xl transition-all duration-300 border border-gray-200/50 hover:scale-110 transform shadow-lg">
                  <FontAwesomeIcon icon={faFilter} className="text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 transform">
                <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 via-pink-400/30 to-rose-400/20 backdrop-blur-xl border-l-4 border-red-500"></div>
                <div className="relative p-8 shadow-lg">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-red-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 border border-red-500/30">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800 mb-3 text-lg">Budget Alert</h4>
                      <p className="text-red-700 mb-4">You&apos;re 12% over your dining budget this month</p>
                      <button className="text-red-600 font-bold hover:text-red-800 transition-colors bg-red-100/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 transform">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-indigo-400/30 to-cyan-400/20 backdrop-blur-xl border-l-4 border-blue-500"></div>
                <div className="relative p-8 shadow-lg">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 border border-blue-500/30">
                      <FontAwesomeIcon icon={faLightbulb} className="text-blue-600 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 mb-3 text-lg">Investment Tip</h4>
                      <p className="text-blue-700 mb-4">Tech stocks down 3% - potential buying opportunity</p>
                      <button className="text-blue-600 font-bold hover:text-blue-800 transition-colors bg-blue-100/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                        Learn More →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 transform">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-emerald-400/30 to-teal-400/20 backdrop-blur-xl border-l-4 border-green-500"></div>
                <div className="relative p-8 shadow-lg">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 border border-green-500/30">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800 mb-3 text-lg">Goal Progress</h4>
                      <p className="text-green-700 mb-4">On track to reach emergency fund goal by December!</p>
                      <button className="text-green-600 font-bold hover:text-green-800 transition-colors bg-green-100/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                        View Progress →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Gamified Challenges and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gamified Savings Challenges */}
          <div className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] transform">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 to-orange-50/30"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-700 flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <FontAwesomeIcon icon={faTrophy} className="text-white animate-bounce" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Savings Challenges
                  </span>
                </h3>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  <FontAwesomeIcon icon={faStar} className="animate-pulse" />
                  <span>{points} points</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {dashboardData?.challenges?.map((challenge) => (
                  <div key={challenge.id} className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 transform">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 to-gray-100/80 backdrop-blur-xl border border-white/50"></div>
                    <div className="relative p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mr-4 shadow-lg">
                            <FontAwesomeIcon icon={challenge.category === 'coffee' ? faCoffee : faUtensils} className="text-white" />
                          </div>
                          <span className="font-bold text-gray-800 text-lg">{challenge.title}</span>
                        </div>
                        <button 
                          onClick={() => completeChallenge(challenge.id)}
                          className="group px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:scale-110 transform"
                        >
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2 group-hover:scale-110 transition-transform" />
                          Complete
                        </button>
                      </div>
                      <p className="text-gray-600 mb-4">{challenge.description}</p>
                      <div className="relative w-full bg-gray-200/50 rounded-full h-3 overflow-hidden backdrop-blur-sm mb-3">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg" 
                          style={{ width: `${(challenge.currentDays / challenge.targetDays) * 100}%` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="flex justify-between">
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-800 text-sm font-bold rounded-full backdrop-blur-sm border border-yellow-500/30">
                          {challenge.currentDays}/{challenge.targetDays} days
                        </span>
                        <span className="px-3 py-1 bg-green-500/20 text-green-800 text-sm font-bold rounded-full backdrop-blur-sm border border-green-500/30">
                          ${challenge.currentAmount} saved
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Enhanced Quick Actions */}
          <div className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] transform">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-700 flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <FontAwesomeIcon icon={faBolt} className="text-white animate-pulse" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Quick Actions
                  </span>
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={connectBank}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-110 transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 to-gray-100/80 backdrop-blur-xl border border-white/50"></div>
                  <div className="relative flex flex-col items-center justify-center p-6 shadow-lg">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                        <FontAwesomeIcon icon={faUniversity} className="text-white text-lg" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">Connect Bank</span>
                  </div>
                </button>
                
                <button 
                  onClick={setBudget}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-110 transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 to-gray-100/80 backdrop-blur-xl border border-white/50"></div>
                  <div className="relative flex flex-col items-center justify-center p-6 shadow-lg">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-green-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                        <FontAwesomeIcon icon={faCalculator} className="text-white text-lg" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">Set Budget</span>
                  </div>
                </button>
                
                <button 
                  onClick={investmentAdvice}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-110 transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 to-gray-100/80 backdrop-blur-xl border border-white/50"></div>
                  <div className="relative flex flex-col items-center justify-center p-6 shadow-lg">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                        <FontAwesomeIcon icon={faChartLine} className="text-white text-lg" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">Investment Tips</span>
                  </div>
                </button>
                
                <button 
                  onClick={exportData}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-110 transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 to-gray-100/80 backdrop-blur-xl border border-white/50"></div>
                  <div className="relative flex flex-col items-center justify-center p-6 shadow-lg">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-orange-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                        <FontAwesomeIcon icon={faDownload} className="text-white text-lg" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">Export Data</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => setShowAiPanel(true)}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-110 transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/90 to-indigo-100/90 backdrop-blur-xl border border-purple-300/50"></div>
                  <div className="relative flex flex-col items-center justify-center p-6 shadow-lg">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                        <FontAwesomeIcon icon={faRobot} className="text-white text-lg animate-bounce" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-purple-800">Ask AI</span>
                  </div>
                               </button>
                
                <button 
                  onClick={startListening}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-110 transform ${isListening ? 'animate-pulse' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 to-gray-100/80 backdrop-blur-xl border border-white/50"></div>
                  <div className="relative flex flex-col items-center justify-center p-6 shadow-lg">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-red-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                        <FontAwesomeIcon 
                          icon={isListening ? faSpinner : faMicrophoneAlt} 
                          className={`text-white text-lg ${isListening ? 'animate-spin' : 'animate-pulse'}`} 
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {isListening ? 'Listening...' : 'Voice Query'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;