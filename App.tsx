import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Clock, Trophy, AlertTriangle, RefreshCw, UserPlus, Coins, ChevronRight } from 'lucide-react';
import { GameMode, GameStage, TradeConfig, UserState, MarketDataPoint } from './types';
import { SYMBOLS, LANDING_COPY, WIN_COPY_SMALL, WIN_COPY_BIG, LOSS_COPY, INITIAL_PRICE_MAP } from './constants';
import { GradientButton, StatCard } from './components/UIComponents';
import { generateInitialChartData, getNextPrice } from './services/simulation';

const App: React.FC = () => {
  // Global App State
  const [stage, setStage] = useState<GameStage>(GameStage.LANDING);
  const [mode, setMode] = useState<GameMode>(GameMode.FUN);
  const [user, setUser] = useState<UserState>({
    hasWonFirstGame: false,
    balance: 10000, // Virtual Fun Money
    isBonusMoney: false,
    totalEarnings: 0,
  });

  // Game/Trade Configuration
  const [config, setConfig] = useState<TradeConfig>({
    symbol: 'BTCUSDT',
    amount: 1000,
    direction: 'LONG',
    leverage: 2,
    takeProfitPercent: 0.2,
    stopLossPercent: 0.1,
  });

  // Trading Simulation State
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [entryPrice, setEntryPrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [pnlPercent, setPnlPercent] = useState(0);
  const [pnlAmount, setPnlAmount] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);
  
  // UI State
  const [landingText, setLandingText] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    // Pick random landing text
    setLandingText(LANDING_COPY[Math.floor(Math.random() * LANDING_COPY.length)]);
  }, [stage]);

  // --- LOGIC: Simulation Loop ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isGameRunning && stage === GameStage.TRADING) {
      interval = setInterval(() => {
        // 1. Time decay
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver('TIMEOUT');
            return 0;
          }
          return prev - 5; // Speed up time for gameplay (1 sec real = 5 sec game)
        });

        // 2. Price movement
        setCurrentPrice((prevPrice) => {
          const volatility = mode === GameMode.FUN ? 0.0015 : 0.001; // Fun mode slightly wilder
          const newPrice = getNextPrice(prevPrice, volatility);
          
          setMarketData((prevData) => {
            const newData = [...prevData, { time: Date.now(), price: newPrice }];
            if (newData.length > 50) newData.shift(); // Keep chart performant
            return newData;
          });

          // 3. PnL Calculation
          const priceChange = (newPrice - entryPrice) / entryPrice;
          const rawPnl = config.direction === 'LONG' ? priceChange : -priceChange;
          const leveredPnl = rawPnl * config.leverage;
          
          setPnlPercent(leveredPnl);
          setPnlAmount(config.amount * leveredPnl);

          // 4. Check TP/SL
          if (leveredPnl >= config.takeProfitPercent) {
             handleGameOver('TP');
          } else if (leveredPnl <= -config.stopLossPercent) {
             handleGameOver('SL');
          }

          return newPrice;
        });

      }, 200); // Update every 200ms
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameRunning, stage, entryPrice, config]);


  const handleGameOver = (reason: string) => {
    setIsGameRunning(false);
    
    // Calculate final PnL based on current state at closure
    // We use a functional update in setStage or calculate derived here.
    // Since state updates are async, we rely on the values current in the closure or refs.
    // For simplicity in this structure, we pass the final calculated values to result logic.
    
    setStage(GameStage.RESULT);
  };

  // --- ACTIONS ---

  const startGame = useCallback(() => {
    if (mode === GameMode.FUN) {
      setRandomizing(true);
      setStage(GameStage.SETUP);
      
      // Simulate random selection process
      let count = 0;
      const shuffleInterval = setInterval(() => {
        const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const randomDir = Math.random() > 0.5 ? 'LONG' : 'SHORT';
        const randomLev = Math.floor(Math.random() * 3) + 1;
        const randomAmt = Math.floor(Math.random() * 10) * 100 + 100;
        
        setConfig({
          symbol: randomSymbol,
          amount: randomAmt,
          direction: randomDir as 'LONG' | 'SHORT',
          leverage: randomLev,
          takeProfitPercent: (Math.floor(Math.random() * 21) + 10) / 100, // 10-30%
          stopLossPercent: (Math.floor(Math.random() * 16) + 5) / 100, // 5-20%
        });
        count++;
        if (count > 15) {
          clearInterval(shuffleInterval);
          setRandomizing(false);
          startTrading();
        }
      }, 150);
    } else {
      // Real mode: User manual setup
      setStage(GameStage.SETUP);
    }
  }, [mode]);

  const startTrading = () => {
    // Init Chart
    const initialData = generateInitialChartData(config.symbol);
    setMarketData(initialData);
    const startPrice = initialData[initialData.length - 1].price;
    setEntryPrice(startPrice);
    setCurrentPrice(startPrice);
    setPnlPercent(0);
    setPnlAmount(0);
    setTimeLeft(3600);
    
    setStage(GameStage.TRADING);
    setIsGameRunning(true);
  };

  const handleClaimBonus = () => {
    setUser({ ...user, balance: 5, isBonusMoney: true });
    setMode(GameMode.REAL);
    setStage(GameStage.SETUP);
  };

  const handleDeposit = (amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (amount > 0) {
        setUser({ ...user, balance: user.balance + amount, isBonusMoney: false });
        setShowDepositModal(false);
        setMode(GameMode.REAL);
        if (stage === GameStage.RESULT) {
            setStage(GameStage.SETUP);
        }
    }
  };

  const DepositModal = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-white">充值 USDT</h3>
        <p className="text-sm text-slate-400 mb-4">输入金额继续游戏 (模拟)</p>
        <input type="number" id="depositInput" placeholder="100" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white mb-4 outline-none focus:border-pink-500" />
        <div className="flex gap-3">
          <GradientButton variant="secondary" onClick={() => setShowDepositModal(false)}>取消</GradientButton>
          <GradientButton onClick={() => {
            const input = document.getElementById('depositInput') as HTMLInputElement;
            handleDeposit(input.value);
          }}>确认充值</GradientButton>
        </div>
      </div>
    </div>
  );

  // --- SCREENS ---

  const renderLanding = () => (
    <div className="flex flex-col h-full items-center justify-between p-6 bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-950">
      <div className="mt-12 text-center space-y-4 animate-fade-in">
        <div className="inline-block p-4 rounded-full bg-purple-500/20 mb-4 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <Coins size={48} className="text-purple-300" />
        </div>
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-yellow-300 via-pink-400 to-purple-400 neon-text pb-2">
          试试手气
        </h1>
        <p className="text-lg text-slate-300 font-medium px-4 opacity-90 leading-relaxed">
          {landingText}
        </p>
      </div>

      <div className="w-full max-w-sm mb-12 space-y-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center mb-6">
            <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">当前模式</p>
            <p className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                {mode === GameMode.FUN ? '🎢 娱乐模式' : '💰 实盘模式'}
            </p>
        </div>
        <GradientButton onClick={startGame}>
          {mode === GameMode.FUN ? '开始随机挑战' : '配置实盘交易'}
        </GradientButton>
      </div>
    </div>
  );

  const renderSetup = () => {
    if (mode === GameMode.FUN) {
      return (
        <div className="flex flex-col h-full items-center justify-center p-6 bg-slate-900">
           <h2 className="text-2xl font-bold text-white mb-8 animate-pulse">
            {randomizing ? '🎲 系统随机选择中...' : '✅ 挑战目标锁定'}
           </h2>
           
           <div className="w-full max-w-sm space-y-4">
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <span className="text-slate-400">合约</span>
                    <span className={`text-xl font-mono font-bold ${randomizing ? 'text-yellow-400' : 'text-white'}`}>{config.symbol}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <span className="text-slate-400">方向</span>
                    <span className={`text-xl font-bold ${config.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {config.direction === 'LONG' ? '看涨 (Long)' : '看跌 (Short)'}
                    </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <span className="text-slate-400">金额</span>
                    <span className="text-xl font-mono text-white">{config.amount} U</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <span className="text-slate-400">杠杆</span>
                    <span className="text-xl font-mono text-purple-400">{config.leverage}x</span>
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                       <span className="text-xs text-slate-500">止盈</span>
                       <span className="text-green-400 font-mono">{(config.takeProfitPercent * 100).toFixed(0)}%</span>
                   </div>
                   <div className="flex flex-col text-right">
                       <span className="text-xs text-slate-500">止损</span>
                       <span className="text-red-400 font-mono">{(config.stopLossPercent * 100).toFixed(0)}%</span>
                   </div>
                </div>
             </div>
             
             {!randomizing && (
                <div className="animate-bounce mt-8">
                     <p className="text-center text-slate-400 mb-2">准备好了吗？</p>
                </div>
             )}
           </div>
        </div>
      );
    }
    
    // REAL MODE SETUP FORM
    return (
      <div className="flex flex-col h-full p-4 bg-slate-900 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6 text-center">配置您的交易</h2>
        
        <div className="space-y-6 max-w-md mx-auto w-full">
            {/* Symbol Select */}
            <div>
                <label className="block text-slate-400 text-sm mb-2">选择合约</label>
                <div className="grid grid-cols-3 gap-2">
                    {SYMBOLS.slice(0,6).map(s => (
                        <button 
                            key={s}
                            onClick={() => setConfig({...config, symbol: s})}
                            className={`p-2 rounded-lg text-xs font-bold ${config.symbol === s ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Amount */}
            <div>
                <label className="block text-slate-400 text-sm mb-2">下注金额 (余额: {user.balance} U)</label>
                <input 
                    type="range" min="1" max={Math.min(10000, user.balance)} step="10" 
                    value={config.amount}
                    onChange={(e) => setConfig({...config, amount: Number(e.target.value)})}
                    className="w-full accent-purple-500 mb-2"
                />
                <div className="text-right font-mono text-xl text-white">{config.amount} U</div>
            </div>

            {/* Direction */}
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setConfig({...config, direction: 'LONG'})}
                    className={`p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${config.direction === 'LONG' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                >
                    <TrendingUp size={20} /> 看涨
                </button>
                <button 
                    onClick={() => setConfig({...config, direction: 'SHORT'})}
                    className={`p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${config.direction === 'SHORT' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                >
                    <TrendingDown size={20} /> 看跌
                </button>
            </div>

            {/* Leverage */}
            <div>
                 <label className="block text-slate-400 text-sm mb-2">杠杆倍数</label>
                 <div className="flex gap-2">
                     {[1, 2, 3].map(lev => (
                         <button 
                            key={lev}
                            onClick={() => setConfig({...config, leverage: lev})}
                            className={`flex-1 py-2 rounded-lg font-bold ${config.leverage === lev ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-white'}`}
                         >
                            {lev}x
                         </button>
                     ))}
                 </div>
            </div>

            {/* TP / SL */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-400 text-xs mb-1">止盈 ({config.takeProfitPercent * 100}%)</label>
                    <input 
                        type="range" min="0.1" max="0.3" step="0.05"
                        value={config.takeProfitPercent}
                        onChange={(e) => setConfig({...config, takeProfitPercent: Number(e.target.value)})}
                        className="w-full accent-green-500"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 text-xs mb-1">止损 ({config.stopLossPercent * 100}%)</label>
                    <input 
                        type="range" min="0.05" max="0.2" step="0.05"
                        value={config.stopLossPercent}
                        onChange={(e) => setConfig({...config, stopLossPercent: Number(e.target.value)})}
                        className="w-full accent-red-500"
                    />
                </div>
            </div>

            <GradientButton onClick={startTrading} className="mt-4">开始交易</GradientButton>
        </div>
      </div>
    );
  };

  const renderTrading = () => {
    const isProfit = pnlAmount >= 0;
    const currentAssetValue = config.amount + pnlAmount;

    return (
      <div className="flex flex-col h-full bg-slate-950">
        {/* Header Stats */}
        <div className="p-4 grid grid-cols-2 gap-3 bg-slate-900 border-b border-slate-800">
             <StatCard 
                label="当前总资产" 
                value={`$${currentAssetValue.toFixed(2)}`} 
                animate={true}
             />
             <StatCard 
                label="盈亏比例" 
                value={`${(pnlPercent * 100).toFixed(2)}%`} 
                isPositive={isProfit}
             />
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative" ref={chartRef}>
             <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur px-3 py-1 rounded text-xs text-slate-300 font-mono">
                {config.symbol} • {config.leverage}x • {config.direction}
             </div>
             <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-800/80 px-3 py-1 rounded-full text-yellow-400 font-bold border border-yellow-500/30">
                <Clock size={16} />
                <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
             </div>

             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketData}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isProfit ? "#4ade80" : "#f87171"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isProfit ? "#4ade80" : "#f87171"} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={isProfit ? "#4ade80" : "#f87171"} 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        isAnimationActive={false} 
                        strokeWidth={2}
                    />
                </AreaChart>
             </ResponsiveContainer>
             
             {/* Current Price Indicator Line (Visual only) */}
             <div className="absolute bottom-1/2 w-full border-t border-dashed border-white/20 pointer-events-none"></div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-slate-900 border-t border-slate-800">
             <div className="flex justify-between items-center mb-4 text-sm text-slate-400">
                <span>开仓价: {entryPrice.toFixed(2)}</span>
                <span>现价: {currentPrice.toFixed(2)}</span>
             </div>
             <GradientButton variant={isProfit ? 'success' : 'danger'} onClick={() => handleGameOver('MANUAL')}>
                {isProfit ? '💰 止盈落袋 (Stop)' : '🛑 止损离场 (Stop)'}
             </GradientButton>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const isProfit = pnlAmount >= 0;
    const profitPercent = (pnlPercent * 100).toFixed(2);
    
    // Determine messaging
    let message = '';
    let TitleIcon = AlertTriangle;
    
    if (!isProfit) {
        message = LOSS_COPY[Math.floor(Math.random() * LOSS_COPY.length)];
        TitleIcon = TrendingDown;
    } else {
        if (pnlPercent > 0.5) { // Big win threshold
             message = WIN_COPY_BIG[Math.floor(Math.random() * WIN_COPY_BIG.length)].replace('{pnl}', profitPercent);
             TitleIcon = Trophy;
        } else {
             message = WIN_COPY_SMALL[Math.floor(Math.random() * WIN_COPY_SMALL.length)].replace('{pnl}', profitPercent);
             TitleIcon = TrendingUp;
        }
    }

    const handleRetry = () => {
        setStage(GameStage.SETUP);
        startGame();
    };

    return (
      <div className="flex flex-col h-full items-center justify-center p-6 bg-slate-900 relative overflow-hidden">
        {isProfit && <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none" />}
        {!isProfit && <div className="absolute inset-0 bg-red-500/10 pointer-events-none" />}
        
        <div className="relative z-10 w-full max-w-sm text-center">
            <div className={`inline-flex p-6 rounded-full mb-6 ${isProfit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <TitleIcon size={64} />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2">
                {isProfit ? '交易盈利' : '交易亏损'}
            </h2>
            <p className={`text-4xl font-mono font-bold mb-6 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}{profitPercent}%
            </p>
            
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8">
                <p className="text-slate-300 text-sm leading-relaxed">
                    {message}
                </p>
            </div>

            <div className="space-y-3">
                {/* Logic for Buttons based on flow */}
                {mode === GameMode.FUN && (
                    <>
                        <GradientButton variant="secondary" onClick={handleRetry} className="flex gap-2 justify-center">
                            <RefreshCw size={18} /> 再玩一次
                        </GradientButton>
                        {isProfit && (
                            <GradientButton onClick={handleClaimBonus} className="animate-bounce">
                                🎁 领取5U体验金 (真钱!)
                            </GradientButton>
                        )}
                    </>
                )}

                {mode === GameMode.REAL && (
                    <>
                         {isProfit ? (
                             <div className="space-y-3">
                                <p className="text-yellow-400 text-sm font-bold">手气正好，乘胜追击！</p>
                                <GradientButton onClick={handleRetry} className="flex gap-2 justify-center">
                                    <RefreshCw size={18} /> 继续玩 (再赚一笔)
                                </GradientButton>
                                <GradientButton variant="secondary" onClick={() => setShowDepositModal(true)} className="flex gap-2 justify-center">
                                    <Wallet size={18} /> 加大投入 (去充值)
                                </GradientButton>
                             </div>
                         ) : (
                             <div className="space-y-3">
                                {user.isBonusMoney ? (
                                    <>
                                        <GradientButton onClick={() => alert("邀请链接已复制! (模拟)")} variant="primary" className="flex gap-2 justify-center">
                                            <UserPlus size={18} /> 邀请好友 (得5U)
                                        </GradientButton>
                                        <GradientButton onClick={() => setShowDepositModal(true)} variant="secondary" className="flex gap-2 justify-center">
                                            <Wallet size={18} /> 充值回本
                                        </GradientButton>
                                    </>
                                ) : (
                                    <GradientButton onClick={() => setShowDepositModal(true)} variant="primary" className="flex gap-2 justify-center">
                                        <Wallet size={18} /> 充值翻盘
                                    </GradientButton>
                                )}
                             </div>
                         )}
                    </>
                )}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative">
      {/* Container for mobile simulation */}
      <div className="h-full w-full max-w-md mx-auto bg-slate-950 shadow-2xl relative flex flex-col">
        {stage === GameStage.LANDING && renderLanding()}
        {stage === GameStage.SETUP && renderSetup()}
        {stage === GameStage.TRADING && renderTrading()}
        {stage === GameStage.RESULT && renderResult()}
      </div>
      
      {showDepositModal && <DepositModal />}
    </div>
  );
};

export default App;