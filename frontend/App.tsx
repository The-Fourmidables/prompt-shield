import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Send,
  Database,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Cpu,
  Eye,
  EyeOff,
  AlertTriangle,
  User,
  Bot,
  Loader2,
  Sun,
  Moon,
  Paperclip,
  FileText,
  X,
  Lock,
  Unlock,
  File
} from 'lucide-react';

import { secureChatBridge } from './services/bridge';
// import { inspector } from './services/inspector';
// import { vault } from './services/vault';
import { sendToAI } from './services/gemini';
import { ProcessingStep, InspectionResult, ChatMessage, ChatAttachment } from './types';
import { StepIndicator } from './components/StepIndicator';

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'inspect', label: 'Detecting Sensitive Entities', status: 'pending', timestamp: 0 },
  { id: 'mask', label: 'Applying Semantic Masking', status: 'pending', timestamp: 0 },
  { id: 'vault', label: 'Vaulting Sensitive Mappings', status: 'pending', timestamp: 0 },
  { id: 'transmit', label: 'Secure Transmission', status: 'pending', timestamp: 0 },
  { id: 'rehydrate', label: 'Local Response Rehydration', status: 'pending', timestamp: 0 },
  { id: 'purge', label: 'Atomic Memory Wipe', status: 'pending', timestamp: 0 },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModelReality, setShowModelReality] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modelScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [realityData, setRealityData] = useState<{
    maskedUser: string;
    maskedAI: string;
    entities: InspectionResult['entities'];
  } | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (modelScrollRef.current) {
      modelScrollRef.current.scrollTop = modelScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const updateStep = (id: string, status: ProcessingStep['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, timestamp: Date.now() } : s));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        const newAttachment: ChatAttachment = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          data: base64Data,
          mimeType: file.type
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isProcessing) return;

    const userRawText = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setIsProcessing(true);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));
    setRealityData(null);

    const userMsgId = Date.now().toString();

    try {
      updateStep('inspect', 'active');
      await new Promise(r => setTimeout(r, 600));
      const inspectionResult = { maskedText: userRawText, entities: [] };
      updateStep('inspect', 'completed');

      // 1. USER MESSAGE (Initially Raw)
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        rawText: userRawText,
        maskedText: userRawText, 
        rehydratedText: userRawText,
        entities: inspectionResult.entities,
        timestamp: Date.now(),
        attachments: currentAttachments
      };
      setMessages(prev => [...prev, userMessage]);
      setRealityData({ maskedUser: userRawText, maskedAI: '', entities: [] });

      updateStep('mask', 'completed');
      updateStep('vault', 'completed');
      updateStep('transmit', 'active');

      // 2. CALL BRIDGE (Now returns masked_reply too)
      const { reply, masked_reply, masked_prompt, entities } = await secureChatBridge(userRawText);

      updateStep('transmit', 'completed');

      // 3. UPDATE USER MESSAGE (Right Side = Masked Prompt)
      setMessages(prev => prev.map(msg => 
        msg.id === userMsgId ? { ...msg, maskedText: masked_prompt } : msg
      ));

      // 4. UPDATE TABLE
      setRealityData({
        maskedUser: masked_prompt,
        maskedAI: masked_reply, // Show raw AI response in table context if needed
        entities: entities 
      });

      updateStep('rehydrate', 'completed');
      updateStep('purge', 'completed');

      // 5. ASSISTANT MESSAGE (The Critical Fix)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        rawText: '',
        maskedText: masked_reply,   // RIGHT PANEL: Shows <NAME_1>, <ORG_1>
        rehydratedText: reply,      // LEFT PANEL: Shows "Riya Sharma", "Amazon"
        entities: [],
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error(error);
      setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setIsProcessing(false);
    }
  };
  const clearChat = () => {
    setMessages([]);
    setRealityData(null);
    setSteps(INITIAL_STEPS);
    // vault.clear();
  };

  const hasUnmaskedPII = !isShieldActive && realityData && realityData.entities.length > 0;

  return (
    <div className="h-screen bg-white dark:bg-slate-950 flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden text-slate-900 dark:text-slate-200 transition-colors duration-300">
      {/* HEADER */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 shrink-0 transition-colors duration-300 relative z-20">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${isShieldActive ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-red-600 shadow-red-500/20'}`}>
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest text-slate-900 dark:text-white uppercase">PROMPT-SHIELD</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-mono uppercase tracking-tighter">PRE-LLM PRIVACY ENFORCEMENT</p>
            </div>
          </div>

          <button
            onClick={() => setIsShieldActive(!isShieldActive)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all duration-500 font-bold text-[10px] uppercase tracking-widest ${isShieldActive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}
          >
            {isShieldActive ? <ShieldCheck size={14} /> : <AlertTriangle size={14} className="animate-pulse" />}
            <span>{isShieldActive ? 'Shield Active' : 'Shield Off'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white transition-all shadow-sm">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setShowModelReality(!showModelReality)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white transition-all shadow-sm">
            {showModelReality ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden">
        <section className="flex-1 flex flex-col bg-white dark:bg-slate-950 relative overflow-hidden border-r border-slate-200 dark:border-slate-800 transition-colors duration-300 h-full">
          <div className="h-11 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between px-6 shrink-0 transition-colors duration-300">
            <div className="flex items-center space-x-2">
              <Shield size={12} className={isShieldActive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">USER VIEW — ORIGINAL DATA</span>
            </div>
            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight">
              {isShieldActive ? 'Context Restored Locally' : 'Context Leaked to LLM'}
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {messages.length === 0 && !isProcessing && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 space-y-6 opacity-60">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border transition-all duration-500 shadow-xl ${isShieldActive ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-red-500/5 border-red-500/20'}`}>
                  <Shield size={32} className={`transition-colors duration-500 ${isShieldActive ? 'text-emerald-500/50' : 'text-red-500/50'}`} />
                </div>
                <div className="text-center space-y-2">
                  <h2 className={`text-sm font-bold uppercase tracking-widest ${isShieldActive ? 'text-slate-600 dark:text-slate-300' : 'text-red-500/70'}`}>
                    {isShieldActive ? 'Privacy-First AI Chat' : 'Unprotected AI Chat'}
                  </h2>
                  <p className="text-xs font-medium max-w-xs leading-relaxed text-slate-500">
                    {isShieldActive
                      ? "Type naturally. Our shield detects and masks PII before it ever touches the model."
                      : "Privacy Shield is currently disabled. All sensitive information will be transmitted as plain text."}
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] flex space-x-4 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center shadow-md ${msg.role === 'user' ? (isShieldActive ? 'bg-emerald-600' : 'bg-red-600') : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'}`}>
                    {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div className="flex flex-col space-y-3">
                    {/* Attachment Previews in Chat History - NOW ABOVE BUBBLE */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`flex flex-wrap gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.attachments.map(att => (
                          <div key={att.id} className="flex flex-col animate-in zoom-in-95 duration-200">
                            {att.mimeType.startsWith('image/') ? (
                              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg group relative bg-white dark:bg-slate-900">
                                <img src={`data:${att.mimeType};base64,${att.data}`} className="max-w-[200px] max-h-[150px] object-cover hover:scale-105 transition-transform cursor-pointer" alt="attachment preview" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-1 truncate backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                  {att.name}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] shadow-sm max-w-[180px]">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                  <FileText size={20} className="text-emerald-500" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{att.name}</span>
                                  <span className="text-[8px] text-slate-400 uppercase tracking-tighter">{att.type.split('/')[1] || 'Document'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-colors duration-300 ${msg.role === 'user'
                      ? (isShieldActive
                        ? 'bg-emerald-600/10 border border-emerald-200 dark:border-emerald-600/20 text-emerald-900 dark:text-emerald-50'
                        : 'bg-red-600/10 border border-red-200 dark:border-red-600/20 text-red-900 dark:text-red-50')
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}>
                      {msg.rehydratedText}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start animate-pulse">
                <div className="flex space-x-4">
                  <div className="shrink-0 w-8 h-8 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Bot size={16} className="text-emerald-500/50" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl px-5 py-3.5 flex space-x-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 transition-colors duration-300">
            {attachments.length > 0 && (
              <div className="mb-4 flex gap-3 overflow-x-auto p-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shrink-0">
                {attachments.map(att => (
                  <div key={att.id} className="relative group flex-shrink-0">
                    <div className="flex items-center space-x-2 p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] shadow-sm">
                      {att.mimeType.startsWith('image/') ? (
                        <img src={`data:${att.mimeType};base64,${att.data}`} className="w-8 h-8 rounded object-cover" alt="attachment" />
                      ) : (
                        <FileText size={16} className="text-emerald-500" />
                      )}
                      <span className="truncate max-w-[80px] text-slate-500">{att.name}</span>
                    </div>
                    <button onClick={() => removeAttachment(att.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative group max-w-3xl mx-auto flex items-center space-x-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,.pdf,.txt,.doc,.docx" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-emerald-600 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full transition-all shadow-sm">
                <Paperclip size={18} />
              </button>
              {messages.length > 0 && (
                <button onClick={clearChat} className="p-3 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full transition-all shadow-sm">
                  <Trash2 size={18} />
                </button>
              )}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-4 pl-6 pr-14 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans shadow-inner"
                />
                <button
                  onClick={handleSend}
                  disabled={isProcessing || (!input.trim() && attachments.length === 0)}
                  className={`absolute right-2 top-1.5 bottom-1.5 px-4 rounded-full transition-all flex items-center justify-center shadow-lg text-white ${isShieldActive ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {showModelReality && (
          <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right duration-500 border-l border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300 h-full">
            <div className="h-11 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 shrink-0 transition-colors duration-300 relative">
              <div className="flex items-center space-x-2">
                <Database size={12} className="text-cyan-600 dark:text-cyan-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">MODEL VIEW (MASKED ONLY)</span>
              </div>
              {hasUnmaskedPII && (
                <div className="flex items-center space-x-1 text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded-xl text-[8px] font-bold uppercase border border-red-200 dark:border-transparent animate-pulse">
                  <AlertTriangle size={10} />
                  <span>Privacy Breach</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={modelScrollRef}>
              {!isShieldActive && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4 space-y-2 animate-in fade-in scale-95 duration-500">
                  <div className="flex items-center space-x-2 text-red-500">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Privacy Protection Bypassed</span>
                  </div>
                  <p className="text-[10px] text-red-500/70 font-medium leading-relaxed">
                    The Prompt-Shield is currently inactive. All data identified below is being transmitted in raw, unmasked format to the underlying LLM.
                  </p>
                </div>
              )}

              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-600 uppercase mb-4 tracking-widest flex items-center justify-between">
                  <span>Processing Pipeline</span>
                  <span className="text-emerald-500/50">Shield v2.4</span>
                </p>
                <StepIndicator steps={steps} />
              </div>

              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={`model-${msg.id}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[90%] flex space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      <div className={`shrink-0 w-6 h-6 rounded-xl flex items-center justify-center ${msg.role === 'user' ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/30' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800/20'}`}>
                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className={`rounded-2xl px-3 py-2 text-[11px] font-mono leading-relaxed break-words shadow-sm transition-colors duration-300 ${msg.role === 'user'
                          ? (isShieldActive ? 'bg-white dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/40 text-cyan-700 dark:text-cyan-400' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400')
                          : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400/90'
                          }`}>
                          {msg.maskedText || (msg.attachments && msg.attachments.length > 0 ? "[Multimodal Payload]" : "")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {realityData && realityData.entities.length > 0 && (
                <div className="mt-8 space-y-2 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between ml-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isShieldActive ? 'text-slate-500' : 'text-red-500'}`}>
                      {isShieldActive ? 'Active Buffers (Masked)' : 'Exposed Entities (Leaking)'}
                    </span>
                    {isShieldActive ? <Lock size={12} className="text-emerald-500" /> : <Unlock size={12} className="text-red-500 animate-bounce" />}
                  </div>
                  <div className={`divide-y transition-colors duration-500 dark:bg-slate-950 border rounded-3xl overflow-hidden shadow-sm ${isShieldActive ? 'divide-slate-200 dark:divide-slate-800 bg-white border-slate-200 dark:border-slate-800' : 'divide-red-200 dark:divide-red-900 bg-red-50 border-red-200 dark:border-red-900'}`}>
                    {realityData.entities.map(ent => (
                      <div key={ent.id} className="p-3 flex items-center justify-between text-[10px]">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-lg border font-bold text-[8px] uppercase ${isShieldActive ? 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-800' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-500 border-red-200 dark:border-red-800'}`}>
                            {ent.type}
                          </span>
                          <span className={`font-mono ${isShieldActive ? 'text-cyan-700 dark:text-cyan-400' : 'line-through text-slate-400'}`}>{ent.placeholder}</span>
                        </div>
                        <ArrowRight size={10} className={isShieldActive ? "text-slate-300 dark:text-slate-700" : "text-red-300"} />
                        <span className={`font-mono px-2 py-0.5 rounded-lg truncate max-w-[120px] ${isShieldActive ? 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-500' : 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900 shadow-sm'}`}>
                          {ent.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="h-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 flex items-center justify-between shrink-0 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className={`w-1 h-1 rounded-full ${isShieldActive ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
            <span className={`text-[8px] font-bold uppercase tracking-widest ${isShieldActive ? 'text-slate-500 dark:text-slate-600' : 'text-red-500'}`}>
              {isShieldActive ? 'Secure Interaction Enabled' : 'Privacy Protection Bypassed — Data Leakage Warning'}
            </span>
          </div>
        </div>
        <div className="text-[8px] font-mono text-slate-400 dark:text-slate-800 uppercase tracking-tighter">
          Prompt-Shield Architecture • Zero Persistent Storage
        </div>
      </footer>
    </div>
  );
};

export default App;