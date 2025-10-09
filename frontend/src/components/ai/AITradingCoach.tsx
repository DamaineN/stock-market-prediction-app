import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AcademicCapIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrophyIcon,
  BookOpenIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface TradeAnalysis {
  tradeDetails: {
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    total_amount: number;
    profit_loss?: number;
    profit_loss_percent?: number;
  };
  stockPrice: number;
  marketCondition?: 'bullish' | 'bearish' | 'neutral';
}

interface AITradingCoachProps {
  tradeAnalysis: TradeAnalysis | null;
  portfolioValue: number;
  totalTrades: number;
  winRate: number;
  onDismiss: () => void;
}

const AITradingCoach: React.FC<AITradingCoachProps> = ({
  tradeAnalysis,
  portfolioValue,
  totalTrades,
  winRate,
  onDismiss
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tradeAnalysis) {
      generateTradeInsights();
    }
  }, [tradeAnalysis]);

  const generateTradeInsights = async () => {
    setLoading(true);
    
    // Simulate AI analysis (in real implementation, this would call your AI service)
    setTimeout(() => {
      const analysis = analyzeTradeDecision(tradeAnalysis!);
      setInsights(analysis);
      setLoading(false);
    }, 1500);
  };

  const analyzeTradeDecision = (trade: TradeAnalysis) => {
    const { tradeDetails } = trade;
    const analysis: any = {
      overall_grade: 'B+',
      feedback: [],
      lessons: [],
      next_steps: []
    };

    // Analyze trade size
    const tradePercent = (tradeDetails.total_amount / portfolioValue) * 100;
    if (tradePercent > 20) {
      analysis.feedback.push({
        type: 'warning',
        message: `Trade size is ${tradePercent.toFixed(1)}% of portfolio - consider smaller positions to manage risk`,
        icon: 'warning'
      });
      analysis.overall_grade = 'C+';
    } else if (tradePercent < 2) {
      analysis.feedback.push({
        type: 'info',
        message: `Small position (${tradePercent.toFixed(1)}%) - good for learning, but may limit profit potential`,
        icon: 'info'
      });
    } else {
      analysis.feedback.push({
        type: 'success',
        message: `Good position sizing at ${tradePercent.toFixed(1)}% of portfolio`,
        icon: 'check'
      });
    }

    // Analyze profit/loss for sell trades
    if (tradeDetails.action === 'sell' && tradeDetails.profit_loss !== undefined) {
      if (tradeDetails.profit_loss > 0) {
        analysis.feedback.push({
          type: 'success',
          message: `Profitable trade! +${tradeDetails.profit_loss_percent?.toFixed(2)}% return`,
          icon: 'trophy'
        });
        analysis.lessons.push("Taking profits at the right time is crucial for successful trading");
      } else {
        analysis.feedback.push({
          type: 'warning',
          message: `Loss on this trade: ${tradeDetails.profit_loss_percent?.toFixed(2)}% - consider stop-loss strategies`,
          icon: 'warning'
        });
        analysis.lessons.push("Losses are part of trading - focus on risk management and learning from mistakes");
      }
    }

    // Buy trade analysis
    if (tradeDetails.action === 'buy') {
      analysis.feedback.push({
        type: 'info',
        message: `Bought ${tradeDetails.quantity} shares at $${tradeDetails.price.toFixed(2)} - monitor price movements closely`,
        icon: 'chart'
      });
      analysis.lessons.push("After buying, set target prices for both profits and losses");
    }

    // Performance-based advice
    if (totalTrades > 5) {
      if (winRate > 60) {
        analysis.feedback.push({
          type: 'success',
          message: `Strong performance! ${winRate.toFixed(1)}% win rate across ${totalTrades} trades`,
          icon: 'trophy'
        });
        analysis.next_steps.push("Consider increasing position sizes slightly as your skills improve");
      } else if (winRate < 40) {
        analysis.feedback.push({
          type: 'warning',
          message: `Win rate is ${winRate.toFixed(1)}% - focus on improving your strategy`,
          icon: 'warning'
        });
        analysis.next_steps.push("Review your losing trades to identify common patterns");
        analysis.overall_grade = 'C';
      }
    }

    // General lessons
    analysis.lessons.push("Diversification helps reduce risk - avoid putting all money in one stock");
    analysis.next_steps.push("Keep a trading journal to track your decision-making process");

    return analysis;
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'check': return <CheckCircleIcon className="w-5 h-5" />;
      case 'trophy': return <TrophyIcon className="w-5 h-5" />;
      case 'chart': return <ChartBarIcon className="w-5 h-5" />;
      default: return <LightBulbIcon className="w-5 h-5" />;
    }
  };

  const getFeedbackStyle = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  if (!tradeAnalysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <AcademicCapIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Trading Coach</h2>
                <p className="text-sm text-gray-500">Analysis of your {tradeAnalysis.tradeDetails.action} trade for {tradeAnalysis.tradeDetails.symbol}</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Analyzing your trade...</span>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Grade */}
              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getGradeColor(insights.overall_grade)}`}>
                  <TrophyIcon className="w-6 h-6 mr-2" />
                  Grade: {insights.overall_grade}
                </div>
              </div>

              {/* Trade Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trade Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Action</p>
                      <p className="font-semibold capitalize">{tradeAnalysis.tradeDetails.action}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-semibold">{tradeAnalysis.tradeDetails.quantity} shares</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold">${tradeAnalysis.tradeDetails.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-semibold">${tradeAnalysis.tradeDetails.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
                  Feedback on Your Trade
                </h3>
                <div className="space-y-3">
                  {insights.feedback.map((feedback: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getFeedbackStyle(feedback.type)} flex items-start space-x-3`}
                    >
                      {getIconComponent(feedback.icon)}
                      <p className="text-sm">{feedback.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lessons */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <BookOpenIcon className="w-5 h-5 mr-2 text-green-500" />
                  Key Lessons
                </h3>
                <div className="space-y-2">
                  {insights.lessons.map((lesson: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{lesson}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Next Steps
                </h3>
                <div className="space-y-2">
                  {insights.next_steps.map((step: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={onDismiss}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    // In real implementation, this could save the feedback or open learning resources
                    onDismiss();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue Learning
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AITradingCoach;