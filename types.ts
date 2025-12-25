export enum GameMode {
  FUN = 'FUN',
  REAL = 'REAL'
}

export enum GameStage {
  LANDING = 'LANDING',
  SETUP = 'SETUP',
  TRADING = 'TRADING',
  RESULT = 'RESULT'
}

export interface TradeConfig {
  symbol: string;
  amount: number;
  direction: 'LONG' | 'SHORT';
  leverage: number;
  takeProfitPercent: number; // e.g. 0.30 for 30%
  stopLossPercent: number; // e.g. 0.20 for 20%
}

export interface MarketDataPoint {
  time: number;
  price: number;
}

export interface UserState {
  hasWonFirstGame: boolean;
  balance: number; // In USDT
  isBonusMoney: boolean; // True if using the 5U bonus
  totalEarnings: number;
}
