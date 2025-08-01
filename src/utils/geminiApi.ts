/**
 * Utility functions for interacting with the Gemini API
 */

// API key for Gemini API
const API_KEY = 'AIzaSyB2PMyOZzGVCinCR4d6TuDOD9ux1j2plXY';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Interface for financial data to be sent to Gemini API
 */
export interface FinancialData {
  income: number;
  expenses: {
    dining: number;
    transport: number;
    shopping: number;
    entertainment: number;
    bills: number;
    other: number;
  };
  savings: number;
  goal?: {
    description?: string;
    amount?: number;
    date?: string;
  };
  riskProfile?: string;
}

/**
 * Get financial advice from Gemini API
 * @param query The user's query
 * @param financialData The user's financial data
 * @returns The AI response text
 */
export async function getFinancialAdvice(query: string, financialData: FinancialData): Promise<string> {
  try {
    // Calculate total expenses
    const totalExpenses = financialData.expenses.dining + 
                         financialData.expenses.transport + 
                         financialData.expenses.shopping + 
                         financialData.expenses.entertainment + 
                         financialData.expenses.bills + 
                         financialData.expenses.other;
    
    // Construct the prompt
    const prompt = `You are an AI financial advisor. The user has the following financial data:\n\n` +
                  `- Monthly income: $${financialData.income}\n` +
                  `- Monthly expenses: $${totalExpenses} ` +
                  `(Dining: $${financialData.expenses.dining}, Transport: $${financialData.expenses.transport}, ` +
                  `Shopping: $${financialData.expenses.shopping}, Entertainment: $${financialData.expenses.entertainment}, ` +
                  `Bills: $${financialData.expenses.bills}, Other: $${financialData.expenses.other})\n` +
                  `- Savings goal: ${financialData.goal?.description || 'Emergency Fund'} - $${financialData.goal?.amount?.toLocaleString() || '5,000'}\n` +
                  `- Available to invest: $${financialData.savings}\n` +
                  `- Risk profile: ${financialData.riskProfile || 'Moderate'}\n\n` +
                  `Based on this information, provide personalized financial advice for this question: ${query}\n\n` +
                  `Keep your response concise and actionable, with specific numbers and recommendations.`;
    
    // Call Gemini API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Generate financial analysis from Gemini API
 * @param financialData The user's financial data
 * @param goalDescription The user's financial goal description
 * @param goalAmount The user's financial goal amount
 * @param goalDate The user's financial goal target date
 * @returns The AI analysis response
 */
export async function generateFinancialAnalysis(
  financialData: FinancialData,
  goalDescription: string,
  goalAmount: number,
  goalDate: string
): Promise<string> {
  try {
    // Calculate total expenses
    const totalExpenses = financialData.expenses.dining + 
                         financialData.expenses.transport + 
                         financialData.expenses.shopping + 
                         financialData.expenses.entertainment + 
                         financialData.expenses.bills + 
                         financialData.expenses.other;
    
    // Calculate monthly savings
    const monthlySavings = financialData.income - totalExpenses;
    
    // Calculate months until goal date
    const today = new Date();
    const targetDate = new Date(goalDate);
    const monthsUntilGoal = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                           (targetDate.getMonth() - today.getMonth());
    
    // Construct the prompt
    const prompt = `You are an AI financial advisor analyzing a user's financial situation and goals.\n\n` +
                  `Financial Data:\n` +
                  `- Monthly income: $${financialData.income}\n` +
                  `- Monthly expenses: $${totalExpenses}\n` +
                  `- Current monthly savings: $${monthlySavings}\n\n` +
                  `Goal Information:\n` +
                  `- Goal: ${goalDescription}\n` +
                  `- Target amount: $${goalAmount}\n` +
                  `- Target date: ${goalDate} (${monthsUntilGoal} months from now)\n\n` +
                  `Expense Breakdown:\n` +
                  `- Dining: $${financialData.expenses.dining}\n` +
                  `- Transport: $${financialData.expenses.transport}\n` +
                  `- Shopping: $${financialData.expenses.shopping}\n` +
                  `- Entertainment: $${financialData.expenses.entertainment}\n` +
                  `- Bills: $${financialData.expenses.bills}\n` +
                  `- Other: $${financialData.expenses.other}\n\n` +
                  `Please provide a comprehensive financial analysis with the following sections:\n` +
                  `1. Goal Achievability: Analyze if the user can reach their goal by the target date with current savings rate.\n` +
                  `2. Budget Adjustments: Suggest 2-3 specific categories where the user could reduce spending, with exact dollar amounts.\n` +
                  `3. Savings Plan: Recommend a specific monthly savings amount to reach the goal.\n` +
                  `4. Additional Tips: Provide 1-2 actionable financial tips relevant to their situation.\n\n` +
                  `Format your response in a concise, easy-to-read format with clear sections and specific numbers.`;
    
    // Call Gemini API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating financial analysis:', error);
    throw error;
  }
}