import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  PieChart, 
  BarChart3,
  Shield,
  Target,
  AlertCircle,
  Star,
  Award,
  Brain,
  Calculator,
  DollarSign,
  Globe,
  LineChart,
  Users,
  Lightbulb,
  FileText,
  Video,
  Headphones,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: React.ReactNode;
  completed: boolean;
  category: 'fundamentals' | 'analysis' | 'trading' | 'psychology';
  xpReward: number;
  keyPoints: string[];
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: string[];
  estimatedDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: React.ReactNode;
}

const LearningHub: React.FC = () => {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('complete-beginner');
  const [expandedResources, setExpandedResources] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'paths' | 'progress' | 'resources'>('overview');

  const learningModules: LearningModule[] = [
    {
      id: 'what-are-stocks',
      title: 'Chapter 1: What Are Stocks?',
      description: 'Learn the fundamental concept of stock ownership and how companies raise capital.',
      duration: '5 min',
      difficulty: 'Beginner',
      icon: <BookOpen className="h-6 w-6" />,
      completed: completedModules.includes('what-are-stocks'),
      category: 'fundamentals',
      xpReward: 50,
      keyPoints: [
        'A stock represents partial ownership in a company',
        'Shareholders have voting rights and profit sharing',
        'Stock prices fluctuate based on supply and demand',
        'Companies issue stocks to raise capital for growth'
      ]
    },
    {
      id: 'stock-market-basics',
      title: 'Chapter 2: How the Stock Market Works',
      description: 'Understand the mechanics of stock exchanges and trading.',
      duration: '5 min',
      difficulty: 'Beginner',
      icon: <Globe className="h-6 w-6" />,
      completed: completedModules.includes('stock-market-basics'),
      category: 'fundamentals',
      xpReward: 50,
      keyPoints: [
        'Stock exchanges facilitate buying and selling of stocks',
        'NYSE and NASDAQ are the two main US exchanges',
        'Market hours are 9:30 AM to 4:00 PM EST',
        'Prices are determined by supply and demand'
      ]
    },
    {
      id: 'reading-stock-quotes',
      title: 'Chapter 3: Reading Stock Quotes',
      description: 'Learn to understand stock symbols, prices, and basic metrics.',
      duration: '5 min',
      difficulty: 'Beginner',
      icon: <Target className="h-6 w-6" />,
      completed: completedModules.includes('reading-stock-quotes'),
      category: 'fundamentals',
      xpReward: 40,
      keyPoints: [
        'Ticker symbols are unique identifiers for stocks (e.g., AAPL for Apple)',
        'Bid price is what buyers are willing to pay',
        'Ask price is what sellers are asking for',
        'Volume shows how many shares were traded'
      ]
    },
    {
      id: 'order-types',
      title: 'Chapter 4: Types of Orders',
      description: 'Learn different ways to buy and sell stocks.',
      duration: '5 min',
      difficulty: 'Beginner',
      icon: <Calculator className="h-6 w-6" />,
      completed: completedModules.includes('order-types'),
      category: 'trading',
      xpReward: 50,
      keyPoints: [
        'Market orders execute immediately at current price',
        'Limit orders only execute at your specified price or better',
        'Stop-loss orders help limit your losses',
        'Choose order type based on your trading strategy'
      ]
    },
    {
      id: 'company-analysis',
      title: 'Chapter 5: Evaluating Companies',
      description: 'Learn basic ways to assess if a company is a good investment.',
      duration: '7 min',
      difficulty: 'Intermediate',
      icon: <PieChart className="h-6 w-6" />,
      completed: completedModules.includes('company-analysis'),
      category: 'analysis',
      xpReward: 60,
      keyPoints: [
        'P/E ratio compares stock price to company earnings',
        'Revenue growth shows if the company is expanding',
        'Profit margins indicate how efficient the company is',
        'Compare companies within the same industry'
      ]
    },
    {
      id: 'reading-charts',
      title: 'Chapter 6: Reading Stock Charts',
      description: 'Understand price charts and basic patterns.',
      duration: '7 min',
      difficulty: 'Intermediate',
      icon: <LineChart className="h-6 w-6" />,
      completed: completedModules.includes('reading-charts'),
      category: 'analysis',
      xpReward: 60,
      keyPoints: [
        'Charts show stock price movement over time',
        'Uptrends show higher highs and higher lows',
        'Support levels are where prices tend to bounce up',
        'Moving averages smooth out price fluctuations'
      ]
    },
    {
      id: 'risk-management',
      title: 'Chapter 7: Managing Risk',
      description: 'Learn how to protect your investments.',
      duration: '6 min',
      difficulty: 'Beginner',
      icon: <Shield className="h-6 w-6" />,
      completed: completedModules.includes('risk-management'),
      category: 'trading',
      xpReward: 60,
      keyPoints: [
        'Never risk more than you can afford to lose',
        'Diversify across different stocks and sectors',
        'Use stop-losses to limit potential losses',
        'Consider your risk tolerance when investing'
      ]
    },
    {
      id: 'trading-psychology',
      title: 'Chapter 8: Trading Psychology',
      description: 'Learn to control emotions when trading.',
      duration: '6 min',
      difficulty: 'Intermediate',
      icon: <Brain className="h-6 w-6" />,
      completed: completedModules.includes('trading-psychology'),
      category: 'psychology',
      xpReward: 50,
      keyPoints: [
        'Emotions can lead to poor trading decisions',
        'Fear of missing out (FOMO) causes buying at peaks',
        'Fear causes panic selling at market bottoms',
        'Having a plan helps you stay disciplined'
      ]
    }
  ];

  const toggleModuleCompletion = (moduleId: string) => {
    setCompletedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completionPercentage = Math.round((completedModules.length / learningModules.length) * 100);
  const totalXP = learningModules.reduce((sum, module) => {
    return sum + (completedModules.includes(module.id) ? module.xpReward : 0);
  }, 0);
  const maxXP = learningModules.reduce((sum, module) => sum + module.xpReward, 0);
  
  // Calculate category completion
  const categories = {
    fundamentals: learningModules.filter(m => m.category === 'fundamentals'),
    trading: learningModules.filter(m => m.category === 'trading'),
    analysis: learningModules.filter(m => m.category === 'analysis'),
    psychology: learningModules.filter(m => m.category === 'psychology')
  };
  
  const getCategoryProgress = (categoryModules: LearningModule[]) => {
    const completed = categoryModules.filter(m => completedModules.includes(m.id)).length;
    return Math.round((completed / categoryModules.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                <span className="text-sm font-medium text-gray-900">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                <span>{completedModules.length} of {learningModules.length} modules completed</span>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span>{totalXP}/{maxXP} XP</span>
                </div>
              </div>
            </div>
            
            {/* Category Progress */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Progress by Category</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-800">📚 Fundamentals</span>
                    <span className="text-xs text-blue-600">{getCategoryProgress(categories.fundamentals)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${getCategoryProgress(categories.fundamentals)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-green-800">📊 Trading</span>
                    <span className="text-xs text-green-600">{getCategoryProgress(categories.trading)}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-1.5">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${getCategoryProgress(categories.trading)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-purple-800">📈 Analysis</span>
                    <span className="text-xs text-purple-600">{getCategoryProgress(categories.analysis)}%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${getCategoryProgress(categories.analysis)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-orange-800">🧠 Psychology</span>
                    <span className="text-xs text-orange-600">{getCategoryProgress(categories.psychology)}%</span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-1.5">
                    <div 
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${getCategoryProgress(categories.psychology)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Motivation Message */}
            <div className="text-center">
              {completionPercentage === 0 && (
                <p className="text-sm text-gray-600">🚀 Start your learning journey today!</p>
              )}
              {completionPercentage > 0 && completionPercentage < 25 && (
                <p className="text-sm text-gray-600">📚 Great start! Keep building your foundation.</p>
              )}
              {completionPercentage >= 25 && completionPercentage < 50 && (
                <p className="text-sm text-gray-600">💪 You're gaining momentum! Keep going.</p>
              )}
              {completionPercentage >= 50 && completionPercentage < 75 && (
                <p className="text-sm text-gray-600">🎯 Halfway there! You're doing amazing.</p>
              )}
              {completionPercentage >= 75 && completionPercentage < 100 && (
                <p className="text-sm text-gray-600">🔥 Almost there! Finish strong!</p>
              )}
              {completionPercentage === 100 && (
                <p className="text-sm text-gray-600">🎉 Congratulations! You've mastered all modules!</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Path */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Stock Market Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {learningModules.map((module, index) => (
              <div 
                key={module.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  activeModule === module.id 
                    ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-2 rounded-lg ${
                    module.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {module.completed ? <CheckCircle2 className="h-6 w-6" /> : module.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{module.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(module.difficulty)}>
                          {module.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {module.duration}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{module.description}</p>
                    
                    {activeModule === module.id && (
                      <div className="mb-4 space-y-3">
                        {/* XP Reward */}
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-gray-700">Earn <strong>{module.xpReward} XP</strong> upon completion</span>
                        </div>
                        
                        {/* Key Points */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-1">
                            <Lightbulb className="h-4 w-4" />
                            What you'll learn:
                          </h5>
                          <ul className="space-y-2">
                            {module.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-blue-700">
                                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
                        variant="outline"
                        size="sm"
                      >
                        {activeModule === module.id ? 'Hide Details' : 'View Details'}
                      </Button>
                      
                      <Button
                        onClick={() => toggleModuleCompletion(module.id)}
                        size="sm"
                        className={module.completed ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {module.completed ? 'Review' : 'Start Learning'}
                      </Button>
                      
                      {module.completed && (
                        <Button
                          onClick={() => toggleModuleCompletion(module.id)}
                          variant="ghost"
                          size="sm"
                        >
                          Mark as Incomplete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Quick Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">📚 Learn Before You Earn</h5>
              <p className="text-sm text-blue-700">
                Complete the fundamentals modules before moving to advanced topics. Building a strong foundation is key to long-term success.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-2">🎯 Practice Makes Perfect</h5>
              <p className="text-sm text-green-700">
                Use paper trading to practice what you learn. It's the best way to apply knowledge without risking real money.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-900 mb-2">⏰ Take Your Time</h5>
              <p className="text-sm text-yellow-700">
                Don't rush through the material. Take time to understand each concept thoroughly before moving to the next module.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="font-medium text-purple-900 mb-2">📈 Start Small</h5>
              <p className="text-sm text-purple-700">
                When you do start investing with real money, begin with small amounts until you're comfortable with the process.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningHub;