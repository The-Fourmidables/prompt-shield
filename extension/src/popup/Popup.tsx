import React, { useState, useEffect } from 'react';
import { Shield, Settings, Server, Activity, Lock, ExternalLink } from 'lucide-react';

const Popup: React.FC = () => {
  const [mode, setMode] = useState<'solo' | 'enterprise'>('solo');
  const [enterpriseUrl, setEnterpriseUrl] = useState('');
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [vaultCount, setVaultCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load settings
    chrome.storage.sync.get(['mode', 'enterpriseUrl'], (result) => {
      if (result.mode) setMode(result.mode);
      if (result.enterpriseUrl) setEnterpriseUrl(result.enterpriseUrl);
    });

    // Load vault count from session storage
    chrome.storage.session.get(['vault'], (result) => {
      if (result.vault) {
        setVaultCount(Object.keys(result.vault).length);
      }
    });

    // Listen for storage changes
    const storageListener = (changes: any, namespace: string) => {
      if (namespace === 'session' && changes.vault) {
        setVaultCount(Object.keys(changes.vault.newValue || {}).length);
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  useEffect(() => {
    checkStatus();
    // Re-check status every 10 seconds while popup is open
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [mode, enterpriseUrl]);

  const checkStatus = async () => {
    setStatus('checking');
    const baseUrl = mode === 'solo' ? 'http://localhost:8000' : enterpriseUrl;
    if (!baseUrl) {
      setStatus('offline');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) 
      });
      setStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setStatus('offline');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await chrome.storage.sync.set({ mode, enterpriseUrl });
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="shield-icon w-6 h-6" />
          <h1 className="text-xl font-bold">Prompt-Shield</h1>
        </div>
        <div className={`flex items-center gap-1 text-sm ${
          status === 'online' ? 'status-online' : 
          status === 'offline' ? 'status-offline' : 
          'text-slate-400'
        }`}>
          <Activity className={`w-4 h-4 ${status === 'checking' ? 'animate-pulse' : ''}`} />
          <span className="capitalize">{status}</span>
        </div>
      </div>

      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Server className="w-4 h-4" />
            <span>Mode: {mode === 'solo' ? 'Solo (Local)' : 'Enterprise'}</span>
          </div>
          <button 
            onClick={() => setMode(prev => prev === 'solo' ? 'enterprise' : 'solo')}
            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
          >
            Switch
          </button>
        </div>
        
        {mode === 'enterprise' && (
          <div className="mt-2">
            <label className="text-xs text-slate-400 block mb-1">Corporate Proxy URL</label>
            <input 
              type="text" 
              value={enterpriseUrl}
              onChange={(e) => setEnterpriseUrl(e.target.value)}
              placeholder="https://shield.company.com"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm p-2 bg-slate-800 rounded border border-slate-700">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Active Vault Entities</span>
          </div>
          <span className="font-mono text-blue-400">{vaultCount}</span>
        </div>
        
        <p className="text-[10px] text-slate-400 text-center italic">
          Vault is cleared automatically when you close the tab.
        </p>
      </div>

      <div className="border-t border-slate-700 pt-3 flex justify-between">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
        >
          <Settings className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`} />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
          Learn More
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default Popup;
