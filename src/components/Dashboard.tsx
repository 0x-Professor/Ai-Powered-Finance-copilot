'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faCreditCard, faPiggyBank, faChartLine, faExclamationTriangle,
  faLightbulb, faCheckCircle, faCoffee, faUtensils, faDollarSign, faUniversity,
  faCalculator, faChartPie, faDownload, faMicrophone, faRobot, faPaperPlane,
  faMicrophoneAlt, faSpinner, faTrophy, faBell, faStar, faBolt
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

const Dashboard = forwardRef<DashboardHandle, DashboardProps>(({ userGoal }, ref) => {
Dashboard.displayName = 'Dashboard';
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [points, setPoints] = useState(1250);
  const spendingChartRef = useRef<HTMLCanvasElement | null>(null);
  const spendingChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Show welcome alert
    showWelcomeAlert();
    
    // Initialize spending chart
    initializeSpendingChart();
    
    // Set up event listeners
    const aiInputField = document.getElementById('aiInput');
    if (aiInputField) {
      aiInputField.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          askAI();
        }
      });
    }
    
    // Simulate real-time updates
    const updateInterval = setInterval(() => {
      // Update random values for demo purposes
    }, 5000);
    
    return () => {
      clearInterval(updateInterval);
      if (spendingChartInstance.current) {
        spendingChartInstance.current.destroy();
      }
    };
  }, []);

  // Initialize spending chart
  const initializeSpendingChart = () => {
    if (spendingChartRef.current) {
      const ctx = spendingChartRef.current.getContext('2d');
      if (ctx) {
        if (spendingChartInstance.current) {
          spendingChartInstance.current.destroy();
        }
        
        spendingChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Dining', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'],
            datasets: [
              {
                label: 'Actual Spending',
                data: [850, 420, 380, 250, 640, 300],
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1
              },
              {
                label: 'Budget',
                data: [700, 450, 400, 200, 650, 350],
                backgroundColor: 'rgba(209, 213, 219, 0.6)',
                borderColor: 'rgba(209, 213, 219, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Amount ($)'
                }
              }
            }
          }
        });
      }
    }
  };

  // Show welcome alert
  const showWelcomeAlert = () => {
    // Implementation would go here
  };

  // Ask AI function
  const askAI = async () => {
    if (!aiInput.trim()) return;
    
    setIsLoading(true);
    setShowAiPanel(true);
    
    try {
      // Define current spending data
      const financialData: FinancialData = {
        income: 5200,
        expenses: {
          dining: 850,
          transport: 420,
          shopping: 380,
          entertainment: 250,
          bills: 640,
          other: 300
        },
        savings: 1200,
        goal: userGoal,
        riskProfile: 'Moderate'
      };
      
      // Call Gemini API through our utility function
      const aiText = await getFinancialAdvice(aiInput, financialData);
      
      setAiResponse(aiText);
      setAiInput('');
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setAiResponse('Sorry, I encountered an error while processing your request. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // State for voice listening status
  const [isListening, setIsListening] = useState(false);
  
  // Voice interaction functions
  const startListening = async () => {
    // Toggle listening state
    if (isListening) {
      setIsListening(false);
      setAiResponse('Listening stopped.');
      return;
    }
    
    setIsListening(true);
    setShowAiPanel(true);
    setIsLoading(true);
    
    // Simulate voice recognition
    const voiceQueries = [
      "How can I reduce my dining expenses?",
      "Should I invest in stocks or ETFs?",
      "How much should I save each month?",
      "Am I on track to meet my savings goal?",
      "What's the best way to pay off my credit card?"
    ];
    
    const randomQuery = voiceQueries[Math.floor(Math.random() * voiceQueries.length)];
    
    try {
      // Define current spending data
      const financialData: FinancialData = {
        income: 5200,
        expenses: {
          dining: 850,
          transport: 420,
          shopping: 380,
          entertainment: 250,
          bills: 640,
          other: 300
        },
        savings: 1200,
        goal: userGoal,
        riskProfile: 'Moderate'
      };
      
      // Call Gemini API through our utility function
      const aiText = await getFinancialAdvice(randomQuery, financialData);
      
      // Determine if this is an investment-related query
      const isInvestmentQuery = randomQuery.toLowerCase().includes('invest') || 
                               aiText.toLowerCase().includes('invest') || 
                               aiText.toLowerCase().includes('stock') || 
                               aiText.toLowerCase().includes('etf');
      
      // Set the AI response with appropriate UI
      if (isInvestmentQuery) {
        setAiResponse(`
          <div class="text-left">
            <div class="flex items-center mb-3">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-microphone text-white text-sm"></i>
              </div>
              <span class="font-semibold">Voice Query:</span>
            </div>
            <div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
              <p class="text-sm text-blue-700 font-medium">"${randomQuery}"</p>
            </div>
            
            <div class="flex items-center mb-3">
              <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-robot text-white text-sm"></i>
              </div>
              <span class="font-semibold">AI Investment Advisor</span>
            </div>
            <div class="text-gray-700 mb-4 whitespace-pre-wrap">${aiText}</div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              <div class="bg-green-50 p-3 rounded-lg text-center">
                <p class="text-xs text-green-600">Available to Invest</p>
                <p class="font-bold text-green-700">$1,200</p>
              </div>
              <div class="bg-blue-50 p-3 rounded-lg text-center">
                <p class="text-xs text-blue-600">Risk Level</p>
                <p class="font-bold text-blue-700">Moderate</p>
              </div>
              <div class="bg-purple-50 p-3 rounded-lg text-center">
                <p class="text-xs text-purple-600">Recommended</p>
                <p class="font-bold text-purple-700">$100-500</p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                <i class="fas fa-chart-line mr-1"></i>Start Investing
              </button>
              <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                <i class="fas fa-graduation-cap mr-1"></i>Learn More
              </button>
              <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                Ask Another Question
              </button>
            </div>
          </div>
        `);
      } else {
        setAiResponse(`
          <div class="text-left">
            <div class="flex items-center mb-3">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-microphone text-white text-sm"></i>
              </div>
              <span class="font-semibold">Voice Query:</span>
            </div>
            <div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
              <p class="text-sm text-blue-700 font-medium">"${randomQuery}"</p>
            </div>
            
            <div class="flex items-center mb-3">
              <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-robot text-white text-sm"></i>
              </div>
              <span class="font-semibold">AI Financial Advisor</span>
            </div>
            <div class="text-gray-700 whitespace-pre-wrap">${aiText}</div>
            <div class="mt-4 flex space-x-2">
              <button class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Implement This
              </button>
              <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                Tell Me More
              </button>
            </div>
          </div>
        `);
      }
      setIsListening(false);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setAiResponse('Sorry, I encountered an error while processing your voice query. Please try again later.');
      setIsListening(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    startListening
  }));

  const stopListening = () => {
    // Implementation would go here
  };

  // Challenge completion functions
  const completeChallenge = (challengeId: number) => {
    // Implementation would go here
    // For now, just update points
    updatePoints(100);
  };

  const updatePoints = (amount: number) => {
    setPoints(prev => prev + amount);
  };

  // Quick action functions
  const connectBank = () => {
    // Implementation would go here
  };

  const setBudget = () => {
    // Implementation would go here
  };

  const investmentAdvice = () => {
    // Implementation would go here
  };

  const exportData = () => {
    // Implementation would go here
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6">
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
          className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[100px] flex items-center justify-center text-gray-500"
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
          <p className="text-3xl font-bold text-gray-800">$12,450</p>
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
          <p className="text-3xl font-bold mb-1 text-gray-800">$2,840</p>
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
          <p className="text-3xl font-bold mb-1 text-gray-800">$3,200</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
            <div className="bg-success-500 h-2.5 rounded-full progress-bar" style={{ width: '64%' }}></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">$3,200 saved</span>
            <span className="badge badge-success">64%</span>
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
          <p className="text-3xl font-bold mb-1 text-gray-800">$8,750</p>
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
                  <p className="text-sm text-danger-700 mt-1"> You&apos;re 12% over your dining budget this month</p>
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
            <div className="p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center mr-3">
                    <FontAwesomeIcon icon={faCoffee} className="text-warning-600" />
                  </div>
                  <span className="font-medium text-gray-800">Coffee Break Challenge</span>
                </div>
                <button 
                  onClick={() => completeChallenge(1)}
                  className="btn-outline-success text-xs px-3 py-1 rounded-full">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                  Mark Complete
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">Skip buying coffee for a week and save $25</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="bg-warning-500 h-2.5 rounded-full progress-bar" style={{ width: '60%' }}></div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="badge badge-warning">3/5 days</span>
                <span className="badge badge-success">$15 saved</span>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center mr-3">
                    <FontAwesomeIcon icon={faUtensils} className="text-secondary-600" />
                  </div>
                  <span className="font-medium text-gray-800">Meal Prep Master</span>
                </div>
                <button 
                  onClick={() => completeChallenge(2)}
                  className="btn-outline-success text-xs px-3 py-1 rounded-full">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                  Mark Complete
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">Prepare meals at home for 2 weeks and save $120</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="bg-secondary-500 h-2.5 rounded-full progress-bar" style={{ width: '30%' }}></div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="badge badge-secondary">4/14 days</span>
                <span className="badge badge-success">$35 saved</span>
              </div>
            </div>
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
              className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faUniversity} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Connect Bank</span>
            </button>
            
            <button 
              onClick={setBudget}
              className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full gradient-success flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faCalculator} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Set Budget</span>
            </button>
            
            <button 
              onClick={investmentAdvice}
              className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center mb-3 shadow-md">
                <FontAwesomeIcon icon={faChartPie} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Investment Tips</span>
            </button>
            
            <button 
              onClick={exportData}
              className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md">
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


export default Dashboard;