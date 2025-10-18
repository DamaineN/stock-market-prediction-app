// User role types
export type UserRole = 'beginner' | 'casual' | 'paper_trader';

// Quiz answers type (question index -> option index)
export type QuizAnswers = Record<number, number>;

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  category: 'experience' | 'knowledge' | 'goals' | 'frequency';
}

export interface QuizOption {
  text: string;
  value: string;
  scores: {
    beginner: number;
    casual: number;
    paper_trader: number;
  };
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "How would you describe your stock market experience?",
    category: 'experience',
    options: [
      {
        text: "Complete beginner - I've never invested before",
        value: "never_invested",
        scores: { beginner: 3, casual: 0, paper_trader: 0 }
      },
      {
        text: "Some basic knowledge but no real investing experience",
        value: "basic_knowledge",
        scores: { beginner: 2, casual: 1, paper_trader: 0 }
      },
      {
        text: "I've made a few investments but still learning",
        value: "some_investing",
        scores: { beginner: 1, casual: 3, paper_trader: 1 }
      },
      {
        text: "I invest regularly and understand market basics",
        value: "regular_investor",
        scores: { beginner: 0, casual: 2, paper_trader: 2 }
      },
      {
        text: "I'm an experienced trader looking to test strategies",
        value: "experienced_trader",
        scores: { beginner: 0, casual: 0, paper_trader: 3 }
      }
    ]
  },
  {
    id: 2,
    question: "What are you hoping to achieve with this platform?",
    category: 'goals',
    options: [
      {
        text: "Learn the basics of stock market investing",
        value: "learn_basics",
        scores: { beginner: 3, casual: 1, paper_trader: 0 }
      },
      {
        text: "Get occasional insights for my personal investments",
        value: "personal_insights",
        scores: { beginner: 1, casual: 3, paper_trader: 1 }
      },
      {
        text: "Test and refine my trading strategies without real money",
        value: "test_strategies",
        scores: { beginner: 0, casual: 1, paper_trader: 3 }
      },
      {
        text: "Track my portfolio performance and get AI recommendations",
        value: "track_portfolio",
        scores: { beginner: 0, casual: 2, paper_trader: 2 }
      },
      {
        text: "Simulate complex trading scenarios and analyze results",
        value: "simulate_trading",
        scores: { beginner: 0, casual: 0, paper_trader: 3 }
      }
    ]
  },
  {
    id: 3,
    question: "How familiar are you with financial terms and concepts?",
    category: 'knowledge',
    options: [
      {
        text: "I'm not familiar with most financial terms",
        value: "not_familiar",
        scores: { beginner: 3, casual: 0, paper_trader: 0 }
      },
      {
        text: "I understand basic terms like stocks, dividends, P/E ratio",
        value: "basic_terms",
        scores: { beginner: 2, casual: 2, paper_trader: 0 }
      },
      {
        text: "I know intermediate concepts like market cap, volatility, beta",
        value: "intermediate_knowledge",
        scores: { beginner: 1, casual: 3, paper_trader: 1 }
      },
      {
        text: "I understand advanced concepts like options, futures, technical analysis",
        value: "advanced_knowledge",
        scores: { beginner: 0, casual: 1, paper_trader: 2 }
      },
      {
        text: "I'm well-versed in complex trading strategies and risk management",
        value: "expert_knowledge",
        scores: { beginner: 0, casual: 0, paper_trader: 3 }
      }
    ]
  },
  {
    id: 4,
    question: "How often do you plan to use stock prediction tools?",
    category: 'frequency',
    options: [
      {
        text: "Occasionally, when I'm curious about a stock",
        value: "occasionally",
        scores: { beginner: 2, casual: 3, paper_trader: 0 }
      },
      {
        text: "A few times per week to check my investments",
        value: "few_times_week",
        scores: { beginner: 1, casual: 3, paper_trader: 1 }
      },
      {
        text: "Daily, as part of my investment research routine",
        value: "daily_research",
        scores: { beginner: 0, casual: 2, paper_trader: 2 }
      },
      {
        text: "Multiple times daily for active trading decisions",
        value: "multiple_daily",
        scores: { beginner: 0, casual: 0, paper_trader: 3 }
      },
      {
        text: "I just want to learn and explore without pressure",
        value: "learning_mode",
        scores: { beginner: 3, casual: 1, paper_trader: 0 }
      }
    ]
  },
  {
    id: 5,
    question: "What type of investment approach interests you most?",
    category: 'goals',
    options: [
      {
        text: "Long-term buy-and-hold investing",
        value: "buy_hold",
        scores: { beginner: 2, casual: 3, paper_trader: 1 }
      },
      {
        text: "Short-term trading and quick profits",
        value: "short_term_trading",
        scores: { beginner: 0, casual: 1, paper_trader: 3 }
      },
      {
        text: "A mix of both strategies depending on the situation",
        value: "mixed_approach",
        scores: { beginner: 1, casual: 2, paper_trader: 2 }
      },
      {
        text: "I'm not sure yet - I want to learn about different approaches",
        value: "not_sure",
        scores: { beginner: 3, casual: 1, paper_trader: 0 }
      },
      {
        text: "Algorithmic/systematic trading with backtesting",
        value: "algorithmic",
        scores: { beginner: 0, casual: 0, paper_trader: 3 }
      }
    ]
  }
];

export interface QuizScores {
  beginner: number;
  casual: number;
  paper_trader: number;
}

export function calculateUserRole(answers: QuizAnswers): UserRole {
  const scores: QuizScores = { beginner: 0, casual: 0, paper_trader: 0 };
  
  Object.entries(answers).forEach(([questionIndex, optionIndex]) => {
    const question = quizQuestions[parseInt(questionIndex)];
    if (question && question.options[optionIndex]) {
      const selectedOption = question.options[optionIndex];
      scores.beginner += selectedOption.scores.beginner;
      scores.casual += selectedOption.scores.casual;
      scores.paper_trader += selectedOption.scores.paper_trader;
    }
  });
  
  // Determine the role with the highest score
  const maxScore = Math.max(scores.beginner, scores.casual, scores.paper_trader);
  
  if (scores.paper_trader === maxScore) return 'paper_trader';
  if (scores.casual === maxScore) return 'casual';
  return 'beginner';
}

export function getRoleDescription(role: UserRole): string {
  const descriptions = {
    beginner: "Perfect for learning the basics of stock market investing with educational content and simple tools.",
    casual: "Great for occasional investors who want insights and recommendations for their personal portfolio.",
    paper_trader: "Ideal for experienced traders who want to test strategies and simulate trades without real money."
  };
  return descriptions[role] || descriptions.beginner;
}

export function getRoleFeatures(role: UserRole): string[] {
  const features = {
    beginner: [
      "Educational content and tutorials",
      "Simple stock predictions",
      "Basic portfolio tracking",
      "Beginner-friendly interface"
    ],
    casual: [
      "AI-powered stock insights",
      "Portfolio recommendations",
      "Market trend analysis",
      "Investment goal setting"
    ],
    paper_trader: [
      "Advanced prediction models",
      "Paper trading simulation",
      "Strategy backtesting",
      "Detailed analytics and reports"
    ]
  };
  return features[role] || features.beginner;
}