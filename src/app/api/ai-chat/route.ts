import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { message, userProfile, dashboardData, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create context for the AI based on user data
    const context = `
You are an AI Financial Co-Pilot assistant. You help users with personal finance management, budgeting, investment advice, and financial planning.

User Profile: ${userProfile ? JSON.stringify(userProfile, null, 2) : 'Not available'}

Current Financial Data: ${dashboardData ? JSON.stringify(dashboardData, null, 2) : 'Not available'}

Recent Conversation:
${conversationHistory?.map((msg: any) => `${msg.type}: ${msg.content}`).join('\n') || 'No previous conversation'}

Guidelines:
- Be helpful, friendly, and professional
- Provide specific, actionable financial advice
- Use the user's actual financial data when available
- Keep responses concise but informative
- Ask clarifying questions when needed
- Never provide investment advice that could be considered financial planning without proper disclaimers
- Always remind users to consult with financial professionals for major decisions

User's question: ${message}
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(context);
    const response = result.response;
    const aiResponse = response.text();

    return NextResponse.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    // Fallback responses based on common financial queries
    const fallbackResponses: { [key: string]: string } = {
      budget: "I'd be happy to help you create a budget! Start by listing your monthly income and fixed expenses like rent, utilities, and loan payments. Then allocate funds for variable expenses like groceries and entertainment. Aim to save at least 10-20% of your income.",
      save: "Great question about saving! Here are some tips: 1) Automate your savings, 2) Start with an emergency fund of 3-6 months expenses, 3) Take advantage of high-yield savings accounts, 4) Consider the 50/30/20 rule for budgeting.",
      invest: "Investment advice depends on your goals and risk tolerance. Generally, consider: 1) Diversified index funds for long-term growth, 2) Dollar-cost averaging, 3) Starting early to benefit from compound interest. Always consult with a financial advisor for personalized advice.",
      debt: "To manage debt effectively: 1) List all debts with interest rates, 2) Pay minimums on all debts, 3) Focus extra payments on highest interest debt first, 4) Consider debt consolidation if beneficial, 5) Avoid taking on new debt while paying off existing debt.",
      expense: "To reduce expenses: 1) Track all spending for a month, 2) Identify unnecessary subscriptions, 3) Cook more meals at home, 4) Review insurance and utility bills for better rates, 5) Use the 24-hour rule for non-essential purchases."
    };

    const lowerMessage = message.toLowerCase();
    let fallbackResponse = "I'm currently experiencing technical difficulties, but I'm here to help with your financial questions! ";

    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (lowerMessage.includes(key)) {
        fallbackResponse += response;
        break;
      }
    }

    if (fallbackResponse === "I'm currently experiencing technical difficulties, but I'm here to help with your financial questions! ") {
      fallbackResponse += "Could you please rephrase your question or ask about budgeting, saving, investing, debt management, or expense reduction?";
    }

    return NextResponse.json({ 
      response: fallbackResponse,
      timestamp: new Date().toISOString()
    });
  }
}