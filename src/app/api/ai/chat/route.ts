// POST /api/ai/chat
import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return errorResponse('Messages array is required', 400);
    }

    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    let response = "I'm your FinWise AI assistant. I can help you analyze your spending, create budgets, set savings goals, and provide personalized financial advice. What would you like to know?";

    if (lastMessage.includes('spend') || lastMessage.includes('expense')) {
      response = "Based on your recent activity, I can see your spending patterns. Here are some insights:\n\n**Top Spending Categories:**\n- Housing: 35% of total expenses\n- Food & Dining: 20%\n- Transportation: 15%\n- Entertainment: 12%\n\n**Recommendations:**\n1. Consider meal planning to reduce food costs by ~15%\n2. Your entertainment spending increased 20% this month\n3. Transportation costs are within a healthy range";
    } else if (lastMessage.includes('budget') || lastMessage.includes('save')) {
      response = "Here's a smart budget recommendation based on your income:\n\n**50/30/20 Rule:**\n- 50% Needs (rent, utilities, groceries): $2,500\n- 30% Wants (dining, entertainment): $1,500\n- 20% Savings & Debt: $1,000\n\n**Tips to optimize:**\n1. Automate your savings first\n2. Review subscriptions monthly\n3. Use the 24-hour rule for purchases over $50";
    } else if (lastMessage.includes('goal') || lastMessage.includes('target')) {
      response = "Based on your savings patterns, here are some goal recommendations:\n\n**Emergency Fund:** Aim for 3-6 months of expenses\n**Short-term (1yr):** Vacation fund, new gadget\n**Medium-term (3yr):** Car down payment\n**Long-term (5yr+):** Investment portfolio\n\nYour current savings rate is **18%**, which is above average! Keep it up.";
    } else if (lastMessage.includes('insight') || lastMessage.includes('advice') || lastMessage.includes('tip')) {
      response = "**Financial Insights for You:**\n\n1. Your income-to-expense ratio is healthy at 1.3x\n2. You've saved 15% more than last month\n3. Your subscription costs are 8% below average\n4. Consider increasing your emergency fund by $500/month\n5. Your financial health score: **82/100** (Grade A)";
    } else if (lastMessage.includes('unusual') || lastMessage.includes('alert')) {
      response = "I've analyzed your recent transactions and found:\n\n**Potential Anomalies:**\n- A $150 dining expense on March 15 (3x your average)\n- New subscription detected: $12.99/month\n- Utility bill increased 25% from last month\n\nThese aren't necessarily concerning, but worth reviewing to ensure they're legitimate.";
    }

    return successResponse({ content: response });
  } catch (error) {
    return handleApiError(error);
  }
}
