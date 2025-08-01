'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRocket, faBullseye, faBrain, faUniversity, 
  faShieldAlt, faCar, faHome, faChartLine 
} from '@fortawesome/free-solid-svg-icons';

interface OnboardingFlowProps {
  onDashboardLaunch: (goal: {
    description: string;
    amount: number;
    date: string;
  }) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onDashboardLaunch }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userGoal, setUserGoal] = useState<{
    description: string;
    amount: number;
    date: string;
  }>({ description: '', amount: 0, date: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Connect bank step
  const connectBankStep = () => {
    setIsConnecting(true);
    
    // Simulate Plaid connection
    setTimeout(() => {
      setIsConnected(true);
      
      setTimeout(() => {
        setCurrentStep(2);
      }, 1500);
    }, 2000);
  };
  
  // Select goal type
  const selectGoal = (goalType: 'car' | 'house' | 'emergency') => {
    const goalDescriptions = {
      'car': 'Save $10k for a car',
      'house': 'Save $50k for house down payment',
      'emergency': 'Build $5k emergency fund'
    };
    
    const goalAmounts = {
      'car': 10000,
      'house': 50000,
      'emergency': 5000
    };
    
    // Set default date (1 year from now)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    setUserGoal({
      description: goalDescriptions[goalType],
      amount: goalAmounts[goalType],
      date: futureDate.toISOString().split('T')[0]
    });
  };
  
  // Analyze goal
  const analyzeGoal = async () => {
    setIsAnalyzing(true);
    setCurrentStep(3);
    
    try {
      // Define current spending data
      const spendingData = {
        income: 5200,
        expenses: {
          dining: 850,
          transport: 420,
          shopping: 380,
          entertainment: 250,
          bills: 640,
          other: 300
        },
        savings: 1200
      };
      
      // Call Gemini API for analysis
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': 'AIzaSyB2PMyOZzGVCinCR4d6TuDOD9ux1j2plXY'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI financial advisor. The user has the following financial data:\n\n` +
                        `- Monthly income: $${spendingData.income}\n` +
                        `- Monthly expenses: $${spendingData.expenses.dining + spendingData.expenses.transport + 
                          spendingData.expenses.shopping + spendingData.expenses.entertainment + 
                          spendingData.expenses.bills + spendingData.expenses.other} ` +
                        `(Dining: $${spendingData.expenses.dining}, Transport: $${spendingData.expenses.transport}, ` +
                        `Shopping: $${spendingData.expenses.shopping}, Entertainment: $${spendingData.expenses.entertainment}, ` +
                        `Bills: $${spendingData.expenses.bills}, Other: $${spendingData.expenses.other})\n` +
                        `- Savings goal: ${userGoal.description} - $${userGoal.amount.toLocaleString()}\n` +
                        `- Target date: ${userGoal.date}\n\n` +
                        `Analyze their spending patterns and provide a detailed plan to achieve their savings goal. Include:\n` +
                        `1. Whether the goal is achievable by the target date\n` +
                        `2. Specific budget adjustments needed (with dollar amounts)\n` +
                        `3. Monthly savings target\n` +
                        `4. Potential obstacles and solutions\n\n` +
                        `Format your response in clear sections with specific numbers and actionable advice.`
                }
              ]
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      
      // Set the AI analysis
      setAiAnalysis(aiText);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Fallback to static analysis if API fails
      setAiAnalysis(
        `## Goal Analysis: ${userGoal.description}\n\n` +
        `Based on your current spending patterns, this goal is **achievable** by ${userGoal.date}.\n\n` +
        `### Budget Adjustments Needed:\n` +
        `- Reduce dining expenses by $200/month\n` +
        `- Cut entertainment by $100/month\n` +
        `- Optimize transportation costs by $50/month\n\n` +
        `### Monthly Savings Target:\n` +
        `You need to save $${Math.round(userGoal.amount / 12)} per month to reach your goal.\n\n` +
        `### Potential Obstacles:\n` +
        `- Unexpected expenses\n` +
        `- Seasonal spending increases\n\n` +
        `### Recommended Actions:\n` +
        `1. Set up automatic transfers to savings\n` +
        `2. Track spending weekly\n` +
        `3. Review subscriptions and cancel unused ones`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Start dashboard
  const startDashboard = () => {
    onDashboardLaunch(userGoal);
  };

  return (
    <div className="space-y-8">
      {/* Step 1: Welcome & Bank Connection */}
      <div id="step1" className={`bg-white rounded-xl shadow-lg p-8 card-hover ${currentStep !== 1 ? 'hidden' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faRocket} className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to FinanceAI Co-Pilot!</h2>
          <p className="text-gray-600">Let's get your finances on autopilot. First, connect your bank account securely.</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faShieldAlt} className="text-blue-500 mr-3" />
              <div>
                <p className="font-semibold text-blue-800">Bank-Level Security</p>
                <p className="text-blue-600 text-sm">Powered by Plaid - used by 11,000+ apps</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={connectBankStep} 
            disabled={isConnecting}
            className={`w-full bg-gradient-to-r ${isConnected ? 'from-green-500 to-green-600' : 'from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'} text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105`}
          >
            {isConnecting ? (
              <>
                <FontAwesomeIcon icon={faUniversity} className="mr-2" spin />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <FontAwesomeIcon icon={faUniversity} className="mr-2" />
                Connected Successfully!
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUniversity} className="mr-2" />
                Connect Bank Account
              </>
            )}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm">🔒 256-bit encryption • Read-only access • FDIC protected</p>
          </div>
        </div>
      </div>

      {/* Step 2: Goal Setting */}
      <div id="step2" className={`bg-white rounded-xl shadow-lg p-8 card-hover ${currentStep !== 2 ? 'hidden' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faBullseye} className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">What's Your Financial Goal?</h2>
          <p className="text-gray-600">Tell us what you're saving for, and we'll create a personalized plan.</p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button 
              onClick={() => selectGoal('car')} 
              className={`goal-option p-4 border-2 ${userGoal.description === 'Save $10k for a car' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'} rounded-lg hover:border-purple-400 transition-colors`}
            >
              <FontAwesomeIcon icon={faCar} className="text-3xl text-purple-500 mb-2" />
              <p className="font-semibold">New Car</p>
            </button>
            <button 
              onClick={() => selectGoal('house')} 
              className={`goal-option p-4 border-2 ${userGoal.description === 'Save $50k for house down payment' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'} rounded-lg hover:border-purple-400 transition-colors`}
            >
              <FontAwesomeIcon icon={faHome} className="text-3xl text-purple-500 mb-2" />
              <p className="font-semibold">House Down Payment</p>
            </button>
            <button 
              onClick={() => selectGoal('emergency')} 
              className={`goal-option p-4 border-2 ${userGoal.description === 'Build $5k emergency fund' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'} rounded-lg hover:border-purple-400 transition-colors`}
            >
              <FontAwesomeIcon icon={faShieldAlt} className="text-3xl text-purple-500 mb-2" />
              <p className="font-semibold">Emergency Fund</p>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Goal Description</label>
              <input 
                type="text" 
                value={userGoal.description} 
                onChange={(e) => setUserGoal({...userGoal, description: e.target.value})}
                placeholder="e.g., Save $10k for a car" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
                <input 
                  type="number" 
                  value={userGoal.amount || ''} 
                  onChange={(e) => setUserGoal({...userGoal, amount: Number(e.target.value)})}
                  placeholder="10000" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                <input 
                  type="date" 
                  value={userGoal.date} 
                  onChange={(e) => setUserGoal({...userGoal, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <button 
              onClick={analyzeGoal} 
              disabled={!userGoal.description || !userGoal.amount || !userGoal.date}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faChartLine} className="mr-2" />
              Analyze My Goal
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: AI Analysis & Plan */}
      <div id="step3" className={`bg-white rounded-xl shadow-lg p-8 card-hover ${currentStep !== 3 ? 'hidden' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faBrain} className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Analysis Complete!</h2>
          <p className="text-gray-600">Here's your personalized savings plan based on your spending patterns.</p>
        </div>
        
        <div id="aiAnalysis" className="max-w-4xl mx-auto">
          {isAnalyzing ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4">
                <FontAwesomeIcon icon={faBrain} className="text-purple-500 text-4xl pulse-animation" />
              </div>
              <p className="text-gray-600">Analyzing your financial data...</p>
            </div>
          ) : aiAnalysis ? (
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap">
                {aiAnalysis}
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="text-center mt-8">
          <button 
            onClick={startDashboard} 
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300"
          >
            <FontAwesomeIcon icon={faRocket} className="mr-2" />
            Launch My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;