import React from 'react';
import SimplePaperTrading from './SimplePaperTrading';

interface PaperTradeProps {
  symbol?: string;
  companyName?: string;
  currentPrice?: number;
  onTradeExecuted?: (tradeDetails: any) => void;
  className?: string;
}

const PaperTrade: React.FC<PaperTradeProps> = ({ symbol, companyName, currentPrice, onTradeExecuted, className }) => {
  return <SimplePaperTrading />;
};

export default PaperTrade;
