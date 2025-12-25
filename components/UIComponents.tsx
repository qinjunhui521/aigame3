import React from 'react';

export const GradientButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled = false }) => {
  
  let baseClass = "w-full py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-lg flex items-center justify-center ";
  
  switch(variant) {
    case 'primary':
      baseClass += "bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700";
      break;
    case 'secondary':
      baseClass += "bg-slate-700 text-white hover:bg-slate-600 border border-slate-500";
      break;
    case 'danger':
      baseClass += "bg-gradient-to-r from-red-500 to-orange-600 text-white";
      break;
    case 'success':
      baseClass += "bg-gradient-to-r from-green-400 to-emerald-600 text-white";
      break;
  }

  if (disabled) {
    baseClass += " opacity-50 cursor-not-allowed pointer-events-none";
  }

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClass} ${className}`}>
      {children}
    </button>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  isPositive?: boolean;
  animate?: boolean;
}> = ({ label, value, subValue, isPositive, animate }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center">
      <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-bold ${isPositive === true ? 'text-green-400' : isPositive === false ? 'text-red-400' : 'text-white'} ${animate ? 'scale-110 transition-transform duration-200' : ''}`}>
        {value}
      </div>
      {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
    </div>
  );
};
