'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faCreditCard, faPiggyBank, faChartLine, faExclamationTriangle,
  faLightbulb, faCheckCircle, faCoffee, faUtensils, faDollarSign, faUniversity,
  faCalculator, faChartPie, faDownload, faMicrophone, faRobot, faPaperPlane,
  faMicrophoneAlt, faSpinner, faTrophy
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
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Monthly Spending</h3>
            <FontAwesomeIcon icon={faCreditCard} className="text-red-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-800">$2,840</p>
          <p className="text-red-500 text-sm mt-2">+12% from budget</p>
        </div>

        {/* Savings Goal */}
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">{userGoal.description || 'Emergency Fund'}</h3>
            <FontAwesomeIcon icon={faPiggyBank} className="text-blue-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-800">$3,200</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div className="bg-blue-500 h-2 rounded-full progress-bar" style={{ width: '64%' }}></div>
          </div>
          <p className="text-blue-500 text-sm mt-2">64% of ${userGoal.amount?.toLocaleString() || '5,000'} goal</p>
        </div>

        {/* Investment Portfolio */}
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Investments</h3>
            <FontAwesomeIcon icon={faChartLine} className="text-purple-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-800">$8,750</p>
          <p className="text-green-500 text-sm mt-2">+8.4% this month</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending Analysis */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 card-hover">
          <h3 className="text-xl font-semibold mb-6">Spending Analysis</h3>
          <canvas ref={spendingChartRef} width="400" height="200"></canvas>
        </div>

        {/* AI Alerts */}
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <h3 className="text-xl font-semibold mb-6">Smart Alerts</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 mt-1" />
              <div>
                <p className="font-medium text-sm">Overspending Alert</p>
                <p className="text-gray-600 text-xs">You're 12% over your dining budget this month</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <FontAwesomeIcon icon={faLightbulb} className="text-blue-500 mt-1" />
              <div>
                <p className="font-medium text-sm">Investment Opportunity</p>
                <p className="text-gray-600 text-xs">Tech stocks are down 3% - good buying opportunity</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mt-1" />
              <div>
                <p className="font-medium text-sm">Goal Achievement</p>
                <p className="text-gray-600 text-xs">You're on track to reach your emergency fund goal!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gamified Savings Challenges */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6 card-hover">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Savings Challenges</h3>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faTrophy} className="text-yellow-500" />
            <span className="font-semibold text-yellow-600">{points} points</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Challenge 1 */}
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
            <div className="text-center">
              <FontAwesomeIcon icon={faCoffee} className="text-4xl text-yellow-700 mb-3" />
              <h4 className="font-semibold mb-2">Coffee Challenge</h4>
              <p className="text-gray-600 text-sm mb-3">Skip 5 coffee purchases this week</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div className="bg-purple-500 h-2 rounded-full progress-bar" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-purple-600">3/5 completed</p>
              <button 
                onClick={() => completeChallenge(1)} 
                className="mt-3 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Mark Complete
              </button>
            </div>
          </div>

          {/* Challenge 2 */}
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
            <div className="text-center">
              <FontAwesomeIcon icon={faUtensils} className="text-4xl text-red-500 mb-3" />
              <h4 className="font-semibold mb-2">Cook at Home</h4>
              <p className="text-gray-600 text-sm mb-3">Cook dinner 4 times this week</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div className="bg-green-500 h-2 rounded-full progress-bar" style={{ width: '25%' }}></div>
              </div>
              <p className="text-sm text-green-600">1/4 completed</p>
              <button 
                onClick={() => completeChallenge(2)} 
                className="mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Mark Complete
              </button>
            </div>
          </div>

          {/* Challenge 3 */}
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="text-center">
              <FontAwesomeIcon icon={faDollarSign} className="text-4xl text-blue-500 mb-3" />
              <h4 className="font-semibold mb-2">Save $200</h4>
              <p className="text-gray-600 text-sm mb-3">Put aside $200 this month</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div className="bg-blue-500 h-2 rounded-full progress-bar" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-blue-600">$150/200 saved</p>
              <button 
                onClick={() => completeChallenge(3)} 
                className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Add $50
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={connectBank} 
          className="bg-white rounded-xl shadow-lg p-6 card-hover text-center"
        >
          <FontAwesomeIcon icon={faUniversity} className="text-3xl text-blue-500 mb-3" />
          <p className="font-semibold">Connect Bank</p>
        </button>
        <button 
          onClick={setBudget} 
          className="bg-white rounded-xl shadow-lg p-6 card-hover text-center"
        >
          <FontAwesomeIcon icon={faCalculator} className="text-3xl text-green-500 mb-3" />
          <p className="font-semibold">Set Budget</p>
        </button>
        <button 
          onClick={investmentAdvice} 
          className="bg-white rounded-xl shadow-lg p-6 card-hover text-center"
        >
          <FontAwesomeIcon icon={faChartPie} className="text-3xl text-purple-500 mb-3" />
          <p className="font-semibold">Investment Tips</p>
        </button>
        <button 
          onClick={exportData} 
          className="bg-white rounded-xl shadow-lg p-6 card-hover text-center"
        >
          <FontAwesomeIcon icon={faDownload} className="text-3xl text-gray-500 mb-3" />
          <p className="font-semibold">Export Data</p>
        </button>
      </div>
    </div>
  );
});


export default Dashboard;