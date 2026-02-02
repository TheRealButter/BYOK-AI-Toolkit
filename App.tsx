
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { TOOLS } from './constants';
import { ToolConfig, ToolExecutionResult } from './types';
import { executeTool, decodeAudio, decodeAudioData } from './services/geminiService';
import { Button } from './components/Button';
import { Marked, Renderer } from 'marked';

// Simple simulated syntax highlighting for common keywords
const highlightCode = (code: string) => {
  return code
    .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|await|async|try|catch|throw)\b/g, '<span class="hljs-keyword">$1</span>')
    .replace(/(['"`])(.*?)\1/g, '<span class="hljs-string">$1$2$1</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="hljs-attr">$1</span>')
    .replace(/\b([0-9]+)\b/g, '<span class="hljs-number">$1</span>')
    .replace(/\/\/(.*)/g, '<span class="hljs-comment">//$1</span>');
};

// Configure Marked with custom renderer
const renderer = new Renderer();
renderer.code = (code: string, language: string | undefined) => {
  const lang = language || 'code';
  const highlighted = highlightCode(code);
  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-block-lang">${lang}</span>
        <button class="code-copy-btn" data-clipboard-text="${encodeURIComponent(code)}">Copy</button>
      </div>
      <pre><code>${highlighted}</code></pre>
    </div>
  `;
};

const marked = new Marked(renderer);

const App: React.FC = () => {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ToolExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Check for API key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const keySelected = await window.aistudio.hasSelectedApiKey();
        setHasKey(keySelected);
      } else {
        setHasKey(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  // Event delegation for dynamically generated code copy buttons
  useEffect(() => {
    const handleResultsClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('code-copy-btn')) {
        const text = decodeURIComponent(target.getAttribute('data-clipboard-text') || '');
        navigator.clipboard.writeText(text).then(() => {
          const originalText = target.innerText;
          target.innerText = 'Copied!';
          target.classList.add('copied');
          setTimeout(() => {
            target.innerText = originalText;
            target.classList.remove('copied');
          }, 2000);
        });
      }
    };

    const currentResults = resultsRef.current;
    currentResults?.addEventListener('click', handleResultsClick);
    return () => currentResults?.removeEventListener('click', handleResultsClick);
  }, [result]);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const selectedTool = useMemo(() => 
    TOOLS.find(t => t.id === selectedToolId), 
  [selectedToolId]);

  const filteredTools = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleRun = async () => {
    if (!hasKey) {
      await handleOpenKeyDialog();
      return;
    }
    if (!selectedTool || !input.trim()) return;
    setIsLoading(true);
    setResult(null);
    const response = await executeTool(selectedTool, input);
    
    if (response.error?.includes('401') || response.error?.includes('403')) {
      setHasKey(false);
    }
    
    setResult(response);
    setIsLoading(false);

    if (response.audioData) {
      playAudio(response.audioData);
    }
  };

  const playAudio = async (base64: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decoded = decodeAudio(base64);
      const buffer = await decodeAudioData(decoded, audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const copyToClipboard = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) setInput(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const renderToolCard = (tool: ToolConfig) => (
    <div 
      key={tool.id}
      onClick={() => {
        setSelectedToolId(tool.id);
        setResult(null);
        setInput('');
      }}
      className={`p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer group transform hover:-translate-y-2 active:scale-95 flex flex-col h-full ${
        selectedToolId === tool.id 
          ? 'bg-blue-600/15 border-blue-500 ring-4 ring-blue-500/10 scale-[1.02] shadow-[0_30px_60px_rgba(59,130,246,0.2)]' 
          : 'bg-slate-900/40 border-slate-800 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/5'
      }`}
    >
      <div className="flex items-start gap-6 mb-5">
        <div className={`text-5xl bg-slate-800 w-20 h-20 flex items-center justify-center rounded-3xl transition-all duration-700 shadow-inner group-hover:scale-110 group-hover:rotate-6 ${selectedToolId === tool.id ? 'bg-blue-600 text-white rotate-12 scale-110 shadow-2xl' : 'group-hover:bg-slate-700'}`}>
          {tool.icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-black text-2xl mb-2 transition-colors ${selectedToolId === tool.id ? 'text-blue-400' : 'text-slate-100 group-hover:text-white'}`}>
            {tool.name}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed font-medium opacity-80">{tool.description}</p>
        </div>
      </div>
      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-800/50">
        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/50 shadow-sm">
          {tool.category}
        </span>
        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all duration-500 ${selectedToolId === tool.id ? 'text-blue-400 translate-x-0' : 'text-slate-600 group-hover:text-blue-500 translate-x-3 opacity-0 group-hover:opacity-100'}`}>
          Open Utility 
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </div>
      </div>
    </div>
  );

  const renderedContent = useMemo(() => {
    if (!result?.content) return null;
    return marked.parse(result.content);
  }, [result?.content]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <header className="sticky top-0 z-[60] bg-slate-950/80 backdrop-blur-3xl border-b border-slate-900 p-5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setSelectedToolId(null)}>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-blue-500/30 group-hover:rotate-[360deg] transition-transform duration-1000">B</div>
            <div className="hidden sm:block">
              <h1 className="font-black text-2xl tracking-tighter leading-none text-white group-hover:text-blue-400 transition-colors">BYOK AI Toolkit</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mt-1.5 opacity-60">Professional Synthesis v3.2</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-xl hidden lg:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search tools, categories, or functions..." 
                className="bg-slate-900/60 border border-slate-800 rounded-3xl pl-14 pr-8 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 w-full transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-5 py-3 rounded-3xl border transition-all flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl ${hasKey ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/5 border-amber-500/30 text-amber-400'}`}>
              <span className={`w-3 h-3 rounded-full ${hasKey ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]' : 'bg-amber-500 animate-bounce shadow-[0_0_15px_#f59e0b]'}`}></span>
              <span className="hidden md:inline">{hasKey ? 'Engine Connected' : 'Authorization Required'}</span>
              <button onClick={handleOpenKeyDialog} className="ml-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-[10px] text-slate-300 transition-all border border-slate-700/50 active:scale-90">Manage Credentials</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-16 relative">
        {!selectedToolId ? (
          <div className="animate-in fade-in slide-in-from-top-8 duration-1000">
            <div className="mb-20 text-center space-y-8">
              <div className="inline-block px-6 py-2.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[11px] font-black uppercase tracking-[0.5em] mb-4 shadow-2xl">
                The Independent Professional Standard
              </div>
              <h2 className="text-7xl lg:text-9xl font-black text-white tracking-tighter leading-[0.9] max-w-6xl mx-auto">
                Total Privacy. <br/><span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">Total Intelligence.</span>
              </h2>
              <p className="text-slate-400 max-w-3xl mx-auto text-2xl font-medium leading-relaxed opacity-70 pt-6">
                13 precision-engineered tools for high-performance workflows. 
                Encapsulated in your browser, running on your keys.
              </p>
            </div>
            
            <div className="flex justify-center flex-wrap gap-3 mb-16">
              {['all', 'productivity', 'coding', 'writing', 'learning'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-4 text-xs font-black rounded-3xl capitalize transition-all tracking-[0.2em] border-2 ${
                    activeCategory === cat ? 'bg-blue-600 text-white border-blue-500 shadow-2xl shadow-blue-500/30 scale-105' : 'bg-slate-900/40 text-slate-500 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
              {filteredTools.map(renderToolCard)}
            </div>
          </div>
        ) : (
          <div className="w-full animate-in zoom-in-[0.98] fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-20 gap-10">
              <div className="flex items-center gap-10">
                <Button variant="outline" onClick={() => setSelectedToolId(null)} className="rounded-[2.5rem] w-20 h-20 p-0 border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all hover:scale-110 active:scale-90">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                </Button>
                <div className="text-7xl bg-slate-900 border border-slate-800 w-28 h-28 flex items-center justify-center rounded-[3rem] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.8)] ring-8 ring-blue-500/5 animate-bounce-subtle">{selectedTool?.icon}</div>
                <div>
                  <h2 className="text-6xl font-black text-white leading-none tracking-tighter mb-4">{selectedTool?.name}</h2>
                  <div className="flex items-center gap-5">
                    <span className="text-[11px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-5 py-2 rounded-full uppercase tracking-[0.3em]">
                      {selectedTool?.model}
                    </span>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] opacity-60">{selectedTool?.category}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start mb-24">
              <div className="space-y-12">
                <div 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`bg-slate-900 border-2 border-slate-800 rounded-[4rem] p-12 lg:p-14 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-3xl group relative overflow-hidden transition-all duration-500 ${isDragging ? 'drag-active ring-8 ring-blue-500/10' : ''}`}
                >
                  {isDragging && <div className="drag-active-overlay"><div className="bg-slate-950 p-10 rounded-full shadow-2xl border-2 border-blue-500 text-blue-500 font-black uppercase tracking-widest text-lg">Drop Data Here</div></div>}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20"></div>
                  
                  <div className="flex justify-between items-center mb-10">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em]">Command Console</label>
                    <div className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      File Ingestion Supported
                    </div>
                  </div>
                  
                  <div className="relative">
                    {selectedTool?.inputType === 'text' ? (
                      <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-10 text-slate-100 focus:outline-none focus:ring-8 focus:ring-blue-500/10 transition-all text-3xl shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)] placeholder:text-slate-800 font-bold tracking-tight"
                        placeholder={selectedTool.placeholder}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-[3.5rem] p-12 text-slate-100 h-[36rem] focus:outline-none focus:ring-8 focus:ring-blue-500/10 transition-all font-mono text-xl resize-none shadow-[inset_0_4px_30px_rgba(0,0,0,0.7)] placeholder:text-slate-800 leading-relaxed no-scrollbar"
                        placeholder={selectedTool?.placeholder}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="mt-14 flex gap-8">
                    {!hasKey ? (
                      <Button 
                        className="flex-1 py-10 text-3xl font-black tracking-tighter rounded-[2.5rem] shadow-2xl shadow-amber-600/30 transform active:scale-[0.97] transition-all bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 border-b-8 border-amber-900"
                        onClick={handleOpenKeyDialog}
                      >
                        Authorize Engine
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 py-10 text-3xl font-black tracking-tighter rounded-[2.5rem] shadow-2xl shadow-blue-600/40 transform active:scale-[0.97] transition-all bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 border-b-8 border-blue-900"
                        onClick={handleRun}
                        isLoading={isLoading}
                        disabled={!input.trim()}
                      >
                        Synthesize Now
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => {setInput(''); setResult(null);}}
                      disabled={isLoading || !input}
                      className="rounded-[2.5rem] px-14 border-2 border-slate-800 font-black hover:bg-slate-800 transition-all text-slate-500 hover:text-white"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-12 h-full">
                <div className="bg-slate-900 border-2 border-slate-800 rounded-[4rem] p-12 lg:p-14 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8)] flex flex-col min-h-[50rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-14 opacity-[0.03] grayscale pointer-events-none">
                    <div className="text-[25rem] font-black leading-none">{selectedTool?.icon}</div>
                  </div>

                  <div className="flex justify-between items-center mb-12 relative z-10">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em]">Synthesis Intelligence Report</label>
                    {result && !result.error && (
                      <button 
                        onClick={copyToClipboard}
                        className={`text-xs font-black flex items-center gap-4 transition-all active:scale-90 px-8 py-4 rounded-[2rem] border-2 ${
                          copied 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
                            : 'bg-blue-500/5 border-blue-500/20 text-blue-400 hover:bg-blue-500/10'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {copied ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                          )}
                        </svg>
                        {copied ? 'Captured' : 'Export Full Report'}
                      </button>
                    )}
                  </div>

                  <div 
                    ref={resultsRef}
                    className="flex-1 bg-slate-950 border-2 border-slate-800/80 rounded-[3rem] p-14 relative overflow-auto max-h-[1200px] shadow-[inset_0_4px_40px_rgba(0,0,0,0.6)] no-scrollbar z-10"
                  >
                    {!hasKey && !result && !isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 text-center px-24 animate-in fade-in zoom-in-95 duration-1000">
                        <div className="text-[10rem] mb-14 opacity-5 scale-125">🗝️</div>
                        <p className="text-3xl font-black opacity-30 tracking-tighter">Auth Required</p>
                        <p className="text-base mt-8 opacity-20 font-black leading-relaxed max-w-sm mx-auto uppercase tracking-[0.3em]">Initialize your Gemini API credentials to activate the engine.</p>
                      </div>
                    )}
                    
                    {hasKey && !result && !isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 text-center px-24 animate-in fade-in zoom-in-95 duration-1000">
                        <div className="text-[10rem] mb-14 opacity-5 scale-125">⚡</div>
                        <p className="text-3xl font-black opacity-30 tracking-tighter">System Standby</p>
                        <p className="text-base mt-8 opacity-20 font-black leading-relaxed max-w-sm mx-auto uppercase tracking-[0.3em]">Awaiting high-priority parameters from the command console.</p>
                      </div>
                    )}

                    {isLoading && (
                      <div className="space-y-16 py-12">
                        <div className="space-y-8">
                          <div className="h-6 bg-slate-800/50 rounded-full w-3/4 animate-pulse"></div>
                          <div className="h-6 bg-slate-800/50 rounded-full w-full animate-pulse delay-150"></div>
                        </div>
                        <div className="flex flex-col items-center justify-center py-28">
                          <div className="relative">
                            <div className="w-32 h-32 border-[12px] border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-blue-500 animate-pulse">AI</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {result?.error && (
                      <div className="p-14 bg-red-950/10 border-2 border-red-500/20 rounded-[3.5rem] text-red-400">
                        <strong className="text-4xl font-black tracking-tighter uppercase mb-6 block">Synthesis Halted</strong>
                        <p className="text-2xl font-bold opacity-90 italic">{result.error}</p>
                      </div>
                    )}

                    {result?.content && !result.error && renderedContent && (
                      <div 
                        className="prose-custom animate-in fade-in slide-in-from-bottom-12 duration-1000"
                        dangerouslySetInnerHTML={{ __html: renderedContent as string }}
                      />
                    )}
                  </div>
                  
                  {result?.audioData && (
                    <div className="mt-12 p-10 bg-slate-950 border-2 border-blue-500/40 rounded-[3.5rem] flex items-center justify-between shadow-2xl z-20">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center text-white shadow-2xl animate-pulse">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.982 5.982 0 0115 10a5.982 5.982 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.982 3.982 0 0013 10a3.982 3.982 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"></path></svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.5em] mb-2">High-Fidelity Audio Synthesis</p>
                          <p className="text-2xl font-black text-white leading-none tracking-tighter">Vocal Intelligence Engine</p>
                        </div>
                      </div>
                      <Button variant="secondary" onClick={() => playAudio(result.audioData!)} className="rounded-[2rem] px-14 py-6 text-sm font-black uppercase tracking-[0.3em] shadow-2xl">
                        Launch Playback
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t-2 border-slate-900 bg-slate-950/90 p-20 text-center backdrop-blur-3xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row items-center justify-between text-slate-700 text-[11px] font-black uppercase tracking-[0.5em] gap-12">
          <p className="max-w-lg text-left leading-loose opacity-60">BYOK AI Toolkit Labs. Zero data persistence policy. Complete privacy by design.</p>
          <div className="flex items-center gap-10 bg-slate-900/40 px-12 py-7 rounded-[3rem] border-2 border-slate-800 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4">
              <span className={`w-4 h-4 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,1)] ${hasKey ? 'bg-emerald-500' : 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)]'}`}></span>
              {hasKey ? 'Gemini Direct : Ultra' : 'Pipeline : Standby'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
