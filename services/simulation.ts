import { INITIAL_PRICE_MAP } from '../constants';

// Simulates a random walk price movement
// volatility: higher means more movement
// trend: positive for upwards, negative for downwards bias
export const getNextPrice = (currentPrice: number, volatility: number = 0.002, trend: number = 0) => {
  const changePercent = (Math.random() - 0.5 + trend) * volatility;
  return currentPrice * (1 + changePercent);
};

export const generateInitialChartData = (symbol: string, points: number = 20) => {
  const startPrice = INITIAL_PRICE_MAP[symbol] || 1000;
  const data = [];
  let currentPrice = startPrice;
  const now = Date.now();
  
  for (let i = points; i > 0; i--) {
    currentPrice = getNextPrice(currentPrice, 0.003); // Slightly higher historical volatility
    data.push({
      time: now - i * 1000,
      price: currentPrice
    });
  }
  return data;
};
