import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AITradingCoach from '@/components/ai/AITradingCoach';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PlusCircle, 
  MinusCircle,
  RefreshCw,
  Activity,
  BarChart3
} from 'lucide-react';

interface Portfolio {
  id: string;
  created_at: string;
  starting_cash: number;
  cash: number;
  positions: { [symbol: string]: Position };
  total_value: number;
  total_return: number;
  total_return_percent: number;
  trade_count: number;
}

interface Position {
  quantity: number;
  avg_price: number;
  total_invested: number;
  current_price?: number;
  current_value?: number;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
  last_trade_price: number;
  last_trade_date: string;
}

interface Trade {
  timestamp: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  profit_loss?: number;
  profit_loss_percent?: number;
  cash_after: number;
}

interface TradeHistory {
  success: boolean;
  trades: Trade[];
  summary: {
    total_trades: number;
    buy_trades: number;
    sell_trades: number;
    total_bought: number;
    total_sold: number;
    profitable_trades: number;
    losing_trades: number;
    total_realized_pnl: number;
    win_rate: number;
  };
}

const SimplePaperTrading: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Trading form state
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [stockPrice, setStockPrice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'trade' | 'positions' | 'history'>('trade');
  const [showAICoach, setShowAICoach] = useState(false);
  const [tradeAnalysis, setTradeAnalysis] = useState<any>(null);

  const API_BASE = 'http://localhost:8000/api/v1';

  // Create a new portfolio
  const createPortfolio = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/simple-paper-trading/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starting_cash: 10000 })
      });

      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.portfolio);
        setMessage({ type: 'success', text: 'Portfolio created successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create portfolio' });
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setMessage({ type: 'error', text: 'Failed to create portfolio' });
    } finally {
      setLoading(false);
    }
  };

  // Load portfolio
  const loadPortfolio = async (portfolioId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/simple-paper-trading/portfolio/${portfolioId}`);
      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.portfolio);
        loadTradeHistory(portfolioId);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load portfolio' });
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setMessage({ type: 'error', text: 'Failed to load portfolio' });
    } finally {
      setLoading(false);
    }
  };

  // Load trade history
  const loadTradeHistory = async (portfolioId: string) => {
    try {
      const response = await fetch(`${API_BASE}/simple-paper-trading/portfolio/${portfolioId}/history`);
      const data = await response.json();
      
      if (data.success) {
        setTradeHistory(data);
      }
    } catch (error) {
      console.error('Error loading trade history:', error);
    }
  };

  // Get stock quote
  const getStockQuote = async (stockSymbol: string) => {
    try {
      const response = await fetch(`${API_BASE}/simple-paper-trading/quote/${stockSymbol.toUpperCase()}`);
      const data = await response.json();
      
      if (response.ok) {
        setStockPrice(data.price);
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to get stock price' });
        setStockPrice(null);
      }
    } catch (error) {
      console.error('Error getting stock quote:', error);
      setMessage({ type: 'error', text: 'Failed to get stock price' });
      setStockPrice(null);
    }
  };

  // Execute trade
  const executeTrade = async () => {
    if (!portfolio || !symbol || !quantity) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/simple-paper-trading/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_id: portfolio.id,
          symbol: symbol.toUpperCase(),
          action,
          quantity: parseInt(quantity)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        
        // Prepare trade analysis for AI Coach
        const analysis = {
          tradeDetails: {
            symbol: symbol.toUpperCase(),
            action: action as 'buy' | 'sell',
            quantity: parseInt(quantity),
            price: stockPrice,
            total_amount: stockPrice * parseInt(quantity),
            ...data.trade_details // Include profit_loss if it's a sell trade
          },
          stockPrice: stockPrice
        };
        
        // Reload portfolio and history
        await loadPortfolio(portfolio.id);
        
        // Show AI Coach after trade
        setTimeout(() => {
          setTradeAnalysis(analysis);
          setShowAICoach(true);
        }, 1000);
        
        setSymbol('');
        setQuantity('');
        setStockPrice(null);
      } else {
        setMessage({ type: 'error', text: data.message || 'Trade failed' });
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      setMessage({ type: 'error', text: 'Failed to execute trade' });
    } finally {
      setLoading(false);
    }
  };

  // Reset portfolio
  const resetPortfolio = async () => {
    if (!portfolio) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/simple-paper-trading/portfolio/${portfolio.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.portfolio);
        setTradeHistory(null);
        setMessage({ type: 'success', text: 'Portfolio reset successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reset portfolio' });
      }
    } catch (error) {
      console.error('Error resetting portfolio:', error);
      setMessage({ type: 'error', text: 'Failed to reset portfolio' });
    } finally {
      setLoading(false);
    }
  };

  // Handle symbol input change
  const handleSymbolChange = (value: string) => {
    setSymbol(value);
    setStockPrice(null);
    // Get quote when symbol is entered
    if (value.length >= 1) {
      const timer = setTimeout(() => {
        if (value.trim()) {
          getStockQuote(value.trim());
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!portfolio) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Simple Paper Trading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Start your paper trading journey! Create a virtual portfolio with $10,000 to practice trading without real money.
              </p>
              <Button 
                onClick={createPortfolio} 
                disabled={loading}
                className="min-w-[200px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Portfolio
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {message && (
          <div className={`mt-4 p-3 rounded-md border ${
            message.type === 'error' ? 'border-red-500 bg-red-50 text-red-800' : 
            message.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : 
            'border-blue-500 bg-blue-50 text-blue-800'
          }`}>
            <p>{message.text}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {message && (
        <div className={`p-3 rounded-md border mb-6 ${
          message.type === 'error' ? 'border-red-500 bg-red-50 text-red-800' : 
          message.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : 
          'border-blue-500 bg-blue-50 text-blue-800'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(portfolio.total_value)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash Available</p>
                <p className="text-2xl font-bold">{formatCurrency(portfolio.cash)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Return</p>
                <p className={`text-2xl font-bold ${portfolio.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(portfolio.total_return_percent)}
                </p>
              </div>
              {portfolio.total_return >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trades</p>
                <p className="text-2xl font-bold">{portfolio.trade_count}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['trade', 'positions', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'trade' | 'positions' | 'history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Trading Tab */}
      {activeTab === 'trade' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trading Form */}
          <Card>
            <CardHeader>
              <CardTitle>Execute Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stock Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  placeholder="e.g., AAPL, GOOGL, TSLA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
                {stockPrice && (
                  <p className="text-sm text-gray-600 mt-1">
                    Current Price: {formatCurrency(stockPrice)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Number of shares"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Action</label>
                <div className="flex gap-2">
                  <Button
                    variant={action === 'buy' ? 'default' : 'outline'}
                    onClick={() => setAction('buy')}
                    className="flex-1"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Buy
                  </Button>
                  <Button
                    variant={action === 'sell' ? 'default' : 'outline'}
                    onClick={() => setAction('sell')}
                    className="flex-1"
                  >
                    <MinusCircle className="mr-2 h-4 w-4" />
                    Sell
                  </Button>
                </div>
              </div>

              {stockPrice && quantity && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Total {action === 'buy' ? 'Cost' : 'Value'}: {formatCurrency(stockPrice * parseInt(quantity || '0'))}
                  </p>
                </div>
              )}

              <Button
                onClick={executeTrade}
                disabled={loading || !symbol || !quantity || !stockPrice}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  `${action === 'buy' ? 'Buy' : 'Sell'} ${symbol.toUpperCase()}`
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Portfolio Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Portfolio ID:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                  {portfolio.id}
                </code>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Created:</p>
                <p className="text-sm">{formatDate(portfolio.created_at)}</p>
              </div>

              <Button
                onClick={resetPortfolio}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Portfolio
              </Button>

              <Button
                onClick={() => loadPortfolio(portfolio.id)}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <Card>
          <CardHeader>
            <CardTitle>Current Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(portfolio.positions).length === 0 ? (
              <p className="text-center text-gray-500 py-8">No positions yet. Start trading to see your holdings!</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(portfolio.positions).map(([symbol, position]) => (
                  <div key={symbol} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{symbol}</h3>
                      <Badge variant={position.unrealized_pnl && position.unrealized_pnl >= 0 ? 'default' : 'destructive'}>
                        {position.unrealized_pnl_percent ? formatPercent(position.unrealized_pnl_percent) : 'N/A'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Quantity</p>
                        <p className="font-medium">{position.quantity} shares</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Price</p>
                        <p className="font-medium">{formatCurrency(position.avg_price)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current Price</p>
                        <p className="font-medium">{position.current_price ? formatCurrency(position.current_price) : 'Loading...'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">P&L</p>
                        <p className={`font-medium ${position.unrealized_pnl && position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.unrealized_pnl ? formatCurrency(position.unrealized_pnl) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trade Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {tradeHistory ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Trades:</span>
                    <span className="font-medium">{tradeHistory.summary.total_trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-medium">{tradeHistory.summary.win_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Realized P&L:</span>
                    <span className={`font-medium ${tradeHistory.summary.total_realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(tradeHistory.summary.total_realized_pnl)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profitable Trades:</span>
                    <span className="font-medium text-green-600">{tradeHistory.summary.profitable_trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Losing Trades:</span>
                    <span className="font-medium text-red-600">{tradeHistory.summary.losing_trades}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No trades yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                {tradeHistory && tradeHistory.trades.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {tradeHistory.trades.map((trade, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={trade.action === 'buy' ? 'default' : 'secondary'}>
                            {trade.action.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{trade.symbol}</p>
                            <p className="text-sm text-gray-600">
                              {trade.quantity} shares @ {formatCurrency(trade.price)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(trade.total_amount)}</p>
                          {trade.profit_loss !== undefined && (
                            <p className={`text-sm ${trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(trade.profit_loss)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDate(trade.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No trades yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* AI Trading Coach Modal */}
      {showAICoach && tradeAnalysis && (
        <AITradingCoach
          tradeAnalysis={tradeAnalysis}
          portfolioValue={portfolio?.total_value || 10000}
          totalTrades={portfolio?.trade_count || 0}
          winRate={tradeHistory?.summary?.win_rate || 0}
          onDismiss={() => {
            setShowAICoach(false);
            setTradeAnalysis(null);
          }}
        />
      )}
    </div>
  );
};

export default SimplePaperTrading;