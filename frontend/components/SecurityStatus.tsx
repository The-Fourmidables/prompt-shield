
import React from 'react';
import { Shield, ShieldAlert, Lock, Unlock } from 'lucide-react';

interface SecurityStatusProps {
  isVaultActive: boolean;
  mappingCount: number;
  isProcessing: boolean;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({ isVaultActive, mappingCount, isProcessing }) => {
  return (
    <div className="flex items-center space-x-6 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className={`p-1.5 rounded-full ${isVaultActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
          {isVaultActive ? <Shield size={18} /> : <ShieldAlert size={18} />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Shield Status</span>
          <span className={`text-xs font-semibold ${isVaultActive ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isVaultActive ? 'SECURED' : 'STANDBY'}
          </span>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-800" />

      <div className="flex items-center space-x-2">
        <div className={`p-1.5 rounded-full ${isVaultActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
          {isVaultActive ? <Lock size={18} /> : <Unlock size={18} />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Buffer</span>
          <span className="text-xs font-mono font-semibold text-slate-300">
            {mappingCount} Entities
          </span>
        </div>
      </div>

      {isProcessing && (
        <>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-xs font-medium text-emerald-400">Scrubbing...</span>
          </div>
        </>
      )}
    </div>
  );
};
