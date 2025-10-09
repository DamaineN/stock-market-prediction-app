import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, BookOpen, Brain, TrendingUp } from 'lucide-react';
import LearningHub from '@/components/learning/LearningHub';
import { useRouter } from 'next/navigation';

type UserRole = 'beginner' | 'casual' | 'paper-trader';

interface RoleBasedFeaturesProps {
  currentRole: UserRole;
  children?: React.ReactNode;
  selectedStock?: {
    symbol: string;
    name: string;
    price?: number;
  };
}

interface FeatureSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  isPrimary: boolean;
  component?: React.ReactNode;
}

const RoleBasedFeatures: React.FC<RoleBasedFeaturesProps> = ({ 
  currentRole,
  children,
  selectedStock
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const router = useRouter();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleFeatureAction = (featureId: string) => {
    if (featureId === 'learning') {
      setActiveFeature('learning');
    } else if (featureId === 'ai-insights') {
      // Navigate to predictions page
      if (selectedStock) {
        router.push(`/predictions?symbol=${selectedStock.symbol}`);
      } else {
        router.push('/predictions');
      }
    } else if (featureId === 'paper-trading') {
      setActiveFeature('paper-trading');
    }
  };

  const roleConfigs: Record<UserRole, FeatureSection[]> = {
    beginner: [
      {
        id: 'learning',
        title: 'Learning Hub',
        icon: <BookOpen className="h-5 w-5" />,
        description: 'Stock market fundamentals, tutorials, and guided lessons',
        isPrimary: true,
        component: <LearningHub />
      },
      {
        id: 'ai-insights',
        title: 'AI Insights',
        icon: <Brain className="h-5 w-5" />,
        description: 'Get AI-powered market analysis and stock recommendations',
        isPrimary: false,
        component: (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Access simplified AI insights tailored for beginners
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleFeatureAction('ai-insights')}
            >
              View AI Analysis
            </Button>
          </div>
        )
      },
      {
        id: 'paper-trading',
        title: 'Paper Trading',
        icon: <TrendingUp className="h-5 w-5" />,
        description: 'Practice trading with virtual money to build confidence',
        isPrimary: false,
        component: (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Start with virtual trading to practice your skills risk-free
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleFeatureAction('paper-trading')}
            >
              Try Paper Trading
            </Button>
          </div>
        )
      }
    ],
    casual: [
      {
        id: 'ai-insights',
        title: 'AI Insights',
        icon: <Brain className="h-5 w-5" />,
        description: 'Smart market analysis and personalized stock recommendations',
        isPrimary: true,
        component: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Market Overview</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    AI-powered analysis of current market trends and opportunities
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleFeatureAction('ai-insights')}
                  >
                    View Analysis
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Stock Recommendations</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Personalized stock picks based on your preferences and risk profile
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleFeatureAction('ai-insights')}
                  >
                    Get Recommendations
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      },
      {
        id: 'learning',
        title: 'Learning Resources',
        icon: <BookOpen className="h-5 w-5" />,
        description: 'Quick tips and advanced concepts to improve your trading knowledge',
        isPrimary: false,
        component: (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Access curated learning content for intermediate traders
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleFeatureAction('learning')}
            >
              Browse Resources
            </Button>
          </div>
        )
      },
      {
        id: 'paper-trading',
        title: 'Paper Trading',
        icon: <TrendingUp className="h-5 w-5" />,
        description: 'Test your strategies with virtual trading',
        isPrimary: false,
        component: (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Validate your AI insights with risk-free virtual trading
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleFeatureAction('paper-trading')}
            >
              Start Trading
            </Button>
          </div>
        )
      }
    ],
    'paper-trader': [
      {
        id: 'paper-trading',
        title: 'Paper Trading',
        icon: <TrendingUp className="h-5 w-5" />,
        description: 'Advanced virtual trading with portfolio management and analytics',
        isPrimary: true,
        component: children || (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Full paper trading functionality is displayed here
            </p>
            <Button size="sm" variant="outline">Access Trading Platform</Button>
          </div>
        )
      },
      {
        id: 'ai-insights',
        title: 'AI Market Analysis',
        icon: <Brain className="h-5 w-5" />,
        description: 'Advanced AI insights for trading decisions',
        isPrimary: false,
        component: (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Get detailed AI analysis to enhance your trading strategies
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleFeatureAction('ai-insights')}
            >
              View Advanced Analysis
            </Button>
          </div>
        )
      },
      {
        id: 'learning',
        title: 'Advanced Learning',
        icon: <BookOpen className="h-5 w-5" />,
        description: 'Advanced trading strategies and market analysis techniques',
        isPrimary: false,
        component: (
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Master advanced trading concepts and strategies
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleFeatureAction('learning')}
            >
              Explore Advanced Topics
            </Button>
          </div>
        )
      }
    ]
  };

  const currentRoleConfig = roleConfigs[currentRole];
  const primaryFeature = currentRoleConfig.find(feature => feature.isPrimary);
  const secondaryFeatures = currentRoleConfig.filter(feature => !feature.isPrimary);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'casual': return 'bg-blue-100 text-blue-800';
      case 'paper-trader': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleTitle = (role: UserRole) => {
    switch (role) {
      case 'beginner': return 'Beginner';
      case 'casual': return 'Casual Trader';
      case 'paper-trader': return 'Paper Trader';
      default: return role;
    }
  };

  // Show activated feature content
  if (activeFeature === 'learning') {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveFeature(null)}
          >
            ← Back to Features
          </Button>
          <Badge className={getRoleBadgeColor(currentRole)}>
            {formatRoleTitle(currentRole)}
          </Badge>
        </div>
        
        {/* Learning Hub */}
        <LearningHub />
      </div>
    );
  }
  
  if (activeFeature === 'paper-trading') {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveFeature(null)}
          >
            ← Back to Features
          </Button>
          <Badge className={getRoleBadgeColor(currentRole)}>
            {formatRoleTitle(currentRole)}
          </Badge>
        </div>
        
        {/* Paper Trading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Paper Trading Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStock ? (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900">
                  Trading: {selectedStock.symbol} - {selectedStock.name}
                </h4>
                <p className="text-blue-700 text-sm mt-1">
                  Current Price: ${selectedStock.price?.toFixed(2) || 'N/A'}
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-600 text-sm">
                  Select a stock from the search above to begin paper trading.
                </p>
              </div>
            )}
            {children}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Role Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Your Experience Level</span>
            <Badge className={getRoleBadgeColor(currentRole)}>
              {formatRoleTitle(currentRole)}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Primary Feature */}
      {primaryFeature && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {primaryFeature.icon}
              {primaryFeature.title}
              <Badge variant="default" className="ml-auto">Primary</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{primaryFeature.description}</p>
            {primaryFeature.component}
          </CardContent>
        </Card>
      )}

      {/* Secondary Features */}
      {secondaryFeatures.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700">Additional Features</h3>
          {secondaryFeatures.map((feature) => {
            const isExpanded = expandedSections.includes(feature.id);
            return (
              <Card key={feature.id} className="border-l-4 border-l-blue-200">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(feature.id)}
                >
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      {feature.icon}
                      <span>{feature.title}</span>
                      <Badge variant="outline" className="ml-2">Optional</Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    {feature.component}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleBasedFeatures;