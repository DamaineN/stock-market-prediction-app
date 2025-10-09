import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  BookOpenIcon,
  LightBulbIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ChartBarIcon,
  WalletIcon,
  UserIcon
} from '@heroicons/react/24/outline';

// Import existing components
import AIInsight from '@/components/ai/AIInsight';
import SimplePaperTrading from '@/components/trading/SimplePaperTrading';

type UserRole = 'beginner' | 'casual' | 'paper_trader';

interface RoleConfig {
  id: UserRole;
  name: string;
  icon: React.ComponentType<any>;
  primaryColor: string;
  description: string;
  primaryFeature: {
    name: string;
    component: React.ComponentType<any>;
    description: string;
  };
  secondaryFeatures: {
    name: string;
    component: React.ComponentType<any>;
    description: string;
    icon: React.ComponentType<any>;
  }[];
}

interface RoleBasedFeaturesProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  selectedStock?: {
    symbol: string;
    name: string;
    price: number;
  };
}

const RoleBasedFeatures: React.FC<RoleBasedFeaturesProps> = ({
  currentRole = 'casual',
  onRoleChange,
  selectedStock
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Learning Hub Component (placeholder for now)
  const LearningHub: React.FC = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5" />
            Stock Market Basics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-semibold mb-2">What are Stocks?</h4>
                <p className="text-sm text-gray-600">Learn the fundamentals of stock ownership and how companies raise capital.</p>
                <Badge variant="outline" className="mt-2">5 min read</Badge>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-semibold mb-2">Market Orders vs Limit Orders</h4>
                <p className="text-sm text-gray-600">Understand different types of trading orders and when to use them.</p>
                <Badge variant="outline" className="mt-2">3 min read</Badge>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-semibold mb-2">Risk Management</h4>
                <p className="text-sm text-gray-600">Essential principles for protecting your investment capital.</p>
                <Badge variant="outline" className="mt-2">7 min read</Badge>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-semibold mb-2">Reading Stock Charts</h4>
                <p className="text-sm text-gray-600">Basic technical analysis and chart pattern recognition.</p>
                <Badge variant="outline" className="mt-2">10 min read</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5" />
            Interactive Lessons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h5 className="font-medium">Portfolio Diversification</h5>
                  <p className="text-xs text-gray-500">Complete - 15 minutes</p>
                </div>
              </div>
              <Badge>Completed</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h5 className="font-medium">Understanding P/E Ratios</h5>
                  <p className="text-xs text-gray-500">In progress - 8 minutes remaining</p>
                </div>
              </div>
              <Button size="sm">Continue</Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h5 className="font-medium">Options Trading Basics</h5>
                  <p className="text-xs text-gray-500">Locked - Complete lesson 2 first</p>
                </div>
              </div>
              <Badge variant="outline">Locked</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const roleConfigs: RoleConfig[] = [
    {
      id: 'beginner',
      name: 'Beginner',
      icon: BookOpenIcon,
      primaryColor: 'green',
      description: 'Learn stock market fundamentals with guided tutorials',
      primaryFeature: {
        name: 'Learning Hub',
        component: LearningHub,
        description: 'Interactive lessons and tutorials to build your foundation'
      },
      secondaryFeatures: [
        {
          name: 'AI Insights',
          component: AIInsight,
          description: 'Get AI-powered recommendations for your learning journey',
          icon: LightBulbIcon
        },
        {
          name: 'Paper Trading',
          component: SimplePaperTrading,
          description: 'Practice trading with virtual money as you learn',
          icon: BanknotesIcon
        }
      ]
    },
    {
      id: 'casual',
      name: 'Casual',
      icon: LightBulbIcon,
      primaryColor: 'blue',
      description: 'Get quick AI-powered insights for informed decisions',
      primaryFeature: {
        name: 'AI Insights',
        component: AIInsight,
        description: 'Smart recommendations and market analysis'
      },
      secondaryFeatures: [
        {
          name: 'Learning Hub',
          component: LearningHub,
          description: 'Expand your knowledge with educational content',
          icon: BookOpenIcon
        },
        {
          name: 'Paper Trading',
          component: SimplePaperTrading,
          description: 'Test strategies with virtual trading',
          icon: BanknotesIcon
        }
      ]
    },
    {
      id: 'paper_trader',
      name: 'Paper Trader',
      icon: BanknotesIcon,
      primaryColor: 'purple',
      description: 'Advanced trading simulation with real-time data',
      primaryFeature: {
        name: 'Paper Trading',
        component: SimplePaperTrading,
        description: 'Full-featured trading simulator with portfolio management'
      },
      secondaryFeatures: [
        {
          name: 'AI Insights',
          component: AIInsight,
          description: 'AI analysis to support your trading decisions',
          icon: LightBulbIcon
        },
        {
          name: 'Learning Hub',
          component: LearningHub,
          description: 'Advanced trading concepts and strategies',
          icon: BookOpenIcon
        }
      ]
    }
  ];

  const currentConfig = roleConfigs.find(config => config.id === currentRole) || roleConfigs[1];
  const PrimaryComponent = currentConfig.primaryFeature.component;

  const getPrimaryColorClasses = (color: string) => {
    switch (color) {
      case 'green': return 'border-green-500 bg-green-50';
      case 'blue': return 'border-blue-500 bg-blue-50';
      case 'purple': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getIconColorClasses = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'blue': return 'text-blue-600';
      case 'purple': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      {onRoleChange && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Choose Your Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roleConfigs.map((config) => (
                <button
                  key={config.id}
                  onClick={() => onRoleChange(config.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    currentRole === config.id
                      ? `${getPrimaryColorClasses(config.primaryColor)} border-2`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <config.icon className={`h-6 w-6 ${getIconColorClasses(config.primaryColor)}`} />
                    <h3 className="font-semibold">{config.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Feature */}
      <Card className={`border-2 ${getPrimaryColorClasses(currentConfig.primaryColor)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <currentConfig.icon className={`h-6 w-6 ${getIconColorClasses(currentConfig.primaryColor)}`} />
            {currentConfig.primaryFeature.name}
            <Badge variant="secondary">Primary Feature</Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">{currentConfig.primaryFeature.description}</p>
        </CardHeader>
        <CardContent>
          <PrimaryComponent selectedStock={selectedStock} />
        </CardContent>
      </Card>

      {/* Secondary Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentConfig.secondaryFeatures.map((feature, index) => {
          const sectionId = `secondary-${index}`;
          const isExpanded = expandedSections.has(sectionId);
          const FeatureComponent = feature.component;

          return (
            <Card key={sectionId} className="border-gray-200">
              <CardHeader>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection(sectionId)}
                >
                  <div className="flex items-center gap-3">
                    <feature.icon className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                  </div>
                  {isExpanded ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                {!isExpanded && (
                  <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                )}
              </CardHeader>
              
              {isExpanded && (
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  <FeatureComponent selectedStock={selectedStock} />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RoleBasedFeatures;