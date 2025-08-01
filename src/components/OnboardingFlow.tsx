'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRocket, faBullseye, faBrain, faUniversity, 
  faShieldAlt, faCar, faHome, faChartLine,
  faCheckCircle, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { generateFinancialAnalysis, FinancialData } from '../utils/geminiApi';

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

  // Connect bank step with enhanced animation
  const connectBankStep = () => {
    setIsConnecting(true);
    
    setTimeout(() => {
      setIsConnected(true);
      
      setTimeout(() => {
        setCurrentStep(2);
      }, 2000);
    }, 3000);
  };
  
  // Select goal type with enhanced feedback
  const selectGoal = (goalType: 'car' | 'house' | 'emergency') => {
    const goalDescriptions = {
      'car': 'Save for a new car',
      'house': 'Save for house down payment',
      'emergency': 'Build emergency fund'
    };
    
    const goalAmounts = {
      'car': 25000,
      'house': 50000,
      'emergency': 10000
    };
    
    // Set default date (18 months from now for more realistic timeline)
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 18);
    
    setUserGoal({
      description: goalDescriptions[goalType],
      amount: goalAmounts[goalType],
      date: futureDate.toISOString().split('T')[0]
    });
  };
  
  // Enhanced goal analysis
  const analyzeGoal = async () => {
    if (!userGoal.description || !userGoal.amount || !userGoal.date) {
      alert('Please fill in all goal details before proceeding.');
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(3);
    
    try {
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
        goal: {
          description: userGoal.description,
          amount: userGoal.amount,
          date: userGoal.date
        }
      };
      
      const aiText = await generateFinancialAnalysis(
        financialData,
        userGoal.description,
        userGoal.amount,
        userGoal.date
      );
      
      setAiAnalysis(aiText);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Enhanced fallback analysis
      const monthsToGoal = Math.ceil((new Date(userGoal.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
      const monthlyTarget = Math.ceil(userGoal.amount / monthsToGoal);
      
      setAiAnalysis(
        `## 🎯 Goal Analysis: ${userGoal.description}\n\n` +
        `**Target Amount:** $${userGoal.amount.toLocaleString()}\n` +
        `**Timeline:** ${monthsToGoal} months\n` +
        `**Monthly Savings Needed:** $${monthlyTarget.toLocaleString()}\n\n` +
        `### 💡 Achievability Assessment\n` +
        `Your goal is **${monthlyTarget <= 1000 ? 'highly achievable' : monthlyTarget <= 1500 ? 'challenging but doable' : 'ambitious'}** with your current income.\n\n` +
        `### 📊 Recommended Strategy\n` +
        `• Set up automatic transfers of $${monthlyTarget} monthly\n` +
        `• Reduce dining expenses by $200/month\n` +
        `• Consider a high-yield savings account (2.5% APY)\n` +
        `• Track progress weekly to stay motivated\n\n` +
        `### 🚀 Quick Wins\n` +
        `• Cancel unused subscriptions (save ~$50/month)\n` +
        `• Meal prep on Sundays (save ~$150/month)\n` +
        `• Use cashback apps for purchases\n\n` +
        `**Success Probability:** ${monthlyTarget <= 1000 ? '95%' : monthlyTarget <= 1500 ? '80%' : '65%'}`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const startDashboard = () => {
    onDashboardLaunch(userGoal);
  };

  // Progress indicator
  const ProgressIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
              currentStep >= step 
                ? 'bg-primary-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > step ? (
                <FontAwesomeIcon icon={faCheckCircle} />
              ) : (
                step
              )}
            </div>
            {step < 3 && (
              <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <ProgressIndicator />
      
      {/* Step 1: Welcome & Bank Connection */}
      <div className={`card fade-in-up ${currentStep !== 1 ? 'hidden' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
            <FontAwesomeIcon icon={faRocket} className="text-white text-4xl" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to FinanceAI Co-Pilot!</h2>
          <p className="text-xl text-gray-600 mb-2">Your AI-powered financial assistant</p>
          <p className="text-gray-500">Let&apos;s connect your bank account securely to get started.</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faShieldAlt} className="text-white text-xl" />
              </div>
              <div>
                <p className="font-bold text-blue-800 text-lg">Bank-Level Security</p>
                <p className="text-blue-600">Powered by Plaid - used by 11,000+ apps</p>
                <div className="flex items-center mt-2 text-sm text-blue-500">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                  <span>256-bit encryption</span>
                  <span className="mx-2">•</span>
                  <span>Read-only access</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={connectBankStep} 
            disabled={isConnecting || isConnected}
            className={`w-full btn btn-lg transition-all duration-500 ${
              isConnected 
                ? 'btn-success' 
                : isConnecting 
                  ? 'btn-primary opacity-75 cursor-not-allowed' 
                  : 'btn-primary hover:scale-105'
            }`}
          >
            {isConnecting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="mr-3" spin />
                Connecting securely...
              </>
            ) : isConnected ? (
              <>
                <FontAwesomeIcon icon={faCheckCircle} className="mr-3" />
                Connected Successfully!
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUniversity} className="mr-3" />
                Connect Bank Account
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Enhanced Goal Setting */}
      <div className={`card fade-in-up ${currentStep !== 2 ? 'hidden' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <FontAwesomeIcon icon={faBullseye} className="text-white text-4xl" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">What&apos;s Your Financial Goal?</h2>
          <p className="text-xl text-gray-600">Choose your primary savings objective and we&apos;ll create a personalized plan.</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button 
              onClick={() => selectGoal('car')} 
              className={`goal-option p-6 border-2 rounded-xl transition-all duration-300 ${
                userGoal.description === 'Save for a new car' 
                  ? 'border-secondary-400 bg-gradient-to-br from-secondary-50 to-primary-50 shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-secondary-300 hover:shadow-md'
              }`}
            >
              <FontAwesomeIcon icon={faCar} className="text-4xl text-secondary-500 mb-4" />
              <p className="font-bold text-lg mb-2">New Car</p>
              <p className="text-gray-600 text-sm">Save $25,000 for your dream car</p>
            </button>
            
            <button 
              onClick={() => selectGoal('house')} 
              className={`goal-option p-6 border-2 rounded-xl transition-all duration-300 ${
                userGoal.description === 'Save for house down payment' 
                  ? 'border-secondary-400 bg-gradient-to-br from-secondary-50 to-primary-50 shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-secondary-300 hover:shadow-md'
              }`}
            >
              <FontAwesomeIcon icon={faHome} className="text-4xl text-secondary-500 mb-4" />
              <p className="font-bold text-lg mb-2">House Down Payment</p>
              <p className="text-gray-600 text-sm">Save $50,000 for your home</p>
            </button>
            
            <button 
              onClick={() => selectGoal('emergency')} 
              className={`goal-option p-6 border-2 rounded-xl transition-all duration-300 ${
                userGoal.description === 'Build emergency fund' 
                  ? 'border-secondary-400 bg-gradient-to-br from-secondary-50 to-primary-50 shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-secondary-300 hover:shadow-md'
              }`}
            >
              <FontAwesomeIcon icon={faShieldAlt} className="text-4xl text-secondary-500 mb-4" />
              <p className="font-bold text-lg mb-2">Emergency Fund</p>
              <p className="text-gray-600 text-sm">Build $10,000 safety net</p>
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Goal Description</label>
              <input 
                type="text" 
                value={userGoal.description} 
                onChange={(e) => setUserGoal({...userGoal, description: e.target.value})}
                placeholder="e.g., Save for a new Tesla Model 3" 
                className="input w-full text-lg"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Target Amount ($)</label>
                <input 
                  type="number" 
                  value={userGoal.amount || ''} 
                  onChange={(e) => setUserGoal({...userGoal, amount: Number(e.target.value)})}
                  placeholder="25000" 
                  className="input w-full text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Target Date</label>
                <input 
                  type="date" 
                  value={userGoal.date} 
                  onChange={(e) => setUserGoal({...userGoal, date: e.target.value})}
                  className="input w-full text-lg"
                />
              </div>
            </div>
            
            <button 
              onClick={analyzeGoal} 
              disabled={!userGoal.description || !userGoal.amount || !userGoal.date}
              className="w-full btn btn-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faChartLine} className="mr-3" />
              Analyze My Goal with AI
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: Enhanced AI Analysis */}
      <div className={`card fade-in-up ${currentStep !== 3 ? 'hidden' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <FontAwesomeIcon icon={faBrain} className="text-white text-4xl" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">AI Analysis Complete!</h2>
          <p className="text-xl text-gray-600">Here&apos;s your personalized financial roadmap</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {isAnalyzing ? (
            <div className="text-center py-12 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl">
              <div className="w-20 h-20 mx-auto mb-6">
                <FontAwesomeIcon icon={faBrain} className="text-primary-500 text-5xl animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Analyzing Your Financial Data</h3>
              <p className="text-gray-600 mb-6">Our AI is crunching the numbers to create your perfect plan...</p>
              <div className="flex justify-center space-x-1">
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : aiAnalysis ? (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 shadow-inner">
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {aiAnalysis}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        
        {!isAnalyzing && (
          <div className="text-center mt-10">
            <button 
              onClick={startDashboard} 
              className="btn btn-primary btn-lg shadow-xl hover:shadow-2xl"
            >
              <FontAwesomeIcon icon={faRocket} className="mr-3" />
              Launch My Personalized Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;