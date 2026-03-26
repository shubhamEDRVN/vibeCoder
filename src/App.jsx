import React, { useState, useRef, useEffect } from 'react';
import { Send, Code2, Play, Terminal, User, Bot, Loader2, Sparkles, Copy, Check, Key, X, AlertCircle } from 'lucide-react';

const SYSTEM_PROMPT = `You are an elite, world-class UI/UX Designer and Senior Frontend Engineer.
Your mission is to generate breathtaking, production-ready web applications based on the user's request.

CRITICAL ARCHITECTURE RULES:
1. You MUST output a SINGLE, complete HTML file.
2. Wrap your ENTIRE output in a single Markdown code block starting with \`\`\`html and ending with \`\`\`. Do not include any text outside this block.
3. Include Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
4. Include Google Fonts: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
5. Include FontAwesome for icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
6. Apply the Inter font to the body via inline style or Tailwind config.

ELITE DESIGN SYSTEM & AESTHETICS (MANDATORY):
- Aesthetics: Prioritize a premium, modern SaaS look (like Linear, Stripe, Vercel, or Apple).
- Spacing & Layout: Use ample whitespace (p-6, p-8, gap-6). Interfaces must breathe. Use CSS Grid (like Bento boxes) and Flexbox extensively for flawless alignment and structure.
- Typography: Implement strong typographic hierarchy. Headers should be bold and tightly tracked (e.g., text-4xl font-extrabold tracking-tight). Secondary text must be muted and highly legible (text-gray-500 leading-relaxed).
- Components: Soft, modern styling is required: rounded corners (rounded-2xl, rounded-3xl), subtle borders (border border-white/10 or border-gray-200/50), and elegant layered shadows (shadow-sm, shadow-xl, hover:shadow-2xl).
- Colors: Avoid harsh default colors. Use sophisticated palettes (slate, zinc, neutral). Employ premium accent colors (e.g., emerald-500, indigo-500, violet-600) for primary actions and highlights. Use vibrant gradients carefully (bg-gradient-to-r from-blue-600 to-indigo-600).
- Visual Flourishes: Implement modern UI trends heavily, including Glassmorphism (backdrop-blur-md bg-white/10 or bg-gray-900/40) for navbars and modal backgrounds.
- Realism: Fill the UI with highly realistic placeholder data. For images, use beautiful, thematic Unsplash source URLs (e.g., <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80">). Use UI Faces for avatars (https://i.pravatar.cc/150?u=1). Write engaging, real-world copy. DO NOT USE "Lorem Ipsum".
- Dark Mode: When applicable, use deep, rich dark themes (bg-slate-950 or bg-[#0a0a0a]), high-contrast text, and glowing accents.

INTERACTIVE EXPERIENCES (MANDATORY):
- Micro-interactions: EVERY interactive element (buttons, cards, nav links) MUST have smooth CSS transitions (transition-all duration-300 ease-out) and hover/focus states (hover:-translate-y-1, hover:scale-[1.02], hover:bg-opacity-90).
- JavaScript Functionality: Do not just build static shells. Provide robust Vanilla JavaScript inside a <script> tag at the end of the body to make the UI interactive. Implement working tabs, modals, carousels, accordions, toggles, form validations, and dynamic list interactions. Provide an impeccable UX.`;

const fetchWithRetry = async (url, options, retries = 3) => {
  const delays = [2000, 5000, 10000];
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return await res.json();
      
      // If it's a hard error (not a 429 rate limit), throw immediately
      if (res.status !== 429 && res.status < 500) {
        let errorMessage = `HTTP error! status: ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) errorMessage += ` - ${errData.error.message}`;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      
      if (i === retries - 1) throw new Error(`Rate limit exceeded after ${retries} retries.`);
      await new Promise(r => setTimeout(r, delays[i]));
      
    } catch (err) {
      if (err.message && err.message.startsWith('HTTP error!')) throw err;
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // BYOK & Model State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groqApiKey') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('groqModel') || 'llama-3.3-70b-versatile');
  
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('groqApiKey'));
  const [keyInput, setKeyInput] = useState(apiKey);
  const [modelInput, setModelInput] = useState(selectedModel);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const saveSettings = () => {
    const trimmed = keyInput.trim();
    setApiKey(trimmed);
    setSelectedModel(modelInput);
    localStorage.setItem('groqApiKey', trimmed);
    localStorage.setItem('groqModel', modelInput);
    setShowSettings(false);
  };

  const extractCode = (text) => {
    const fence = '`' + '`' + '`';
    const regex = new RegExp(fence + "(?:html)?\\n([\\s\\S]*?)" + fence);
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);
    setError(null);

    try {
      const formattedMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
      
      newMessages.forEach((msg, index) => {
        if (index === newMessages.length - 1) return;
        formattedMessages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        });
      });

      const promptContext = `
        ${currentCode ? `Current Source Code:\n\`\`\`html\n${currentCode}\n\`\`\`\n\n` : ''}
        User Request: ${input}
      `;
      formattedMessages.push({ role: 'user', content: promptContext });

      const url = "https://api.groq.com/openai/v1/chat/completions";
      const payload = { 
        model: selectedModel, 
        messages: formattedMessages,
        temperature: 0.2
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const responseText = data.choices?.[0]?.message?.content || '';
      const extractedCode = extractCode(responseText);
      
      const fence = '`' + '`' + '`';
      const replaceRegex = new RegExp(fence + "(?:html)?\\n[\\s\\S]*?" + fence);
      const cleanMessage = responseText.replace(replaceRegex, '').trim() 
        || "I've updated the code for you. Check the preview!";

      setMessages(prev => [...prev, { role: 'ai', content: cleanMessage }]);
      
      if (extractedCode) {
        setCurrentCode(extractedCode);
        setActiveTab('preview');
      }

    } catch (err) {
      console.warn("API Request Failed:", err.message);
      
      if (err.message && err.message.includes('401')) {
         setError("Invalid Groq API Key. Please verify your key in settings.");
         setShowSettings(true);
      } else if (err.message && err.message.includes('404')) {
         setError("Model not found. Groq may have updated their available models. Try another one in settings.");
         setShowSettings(true);
      } else if (err.message && err.message.includes('429')) {
         setError("Groq Rate Limit Exceeded. You may have hit your Token-Per-Minute limit. Please wait a minute.");
      } else {
         setError(err.message || "Failed to generate response. Check your API key or network.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyCode = () => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = currentCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[450px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 mb-10 transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-500" /> Configuration
              </h2>
              {apiKey && (
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Welcome to <strong>Groq Edition</strong>. Access world-class open-source models with lightning-fast inference capabilities.
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Groq API Key (gsk_...)</label>
                <input 
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-200 transition-all font-mono"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">AI Model</label>
                <div className="relative">
                  <select
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-200 appearance-none transition-all cursor-pointer"
                  >
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
                    <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 (Reasoning)</option>
                    <option value="qwen-2.5-coder-32b">Qwen 2.5 Coder 32B (Best for Code)</option>
                    <option value="mixtral-8x7b-32768">Mixtral 8x7B (Fastest)</option>
                    <option value="gemma2-9b-it">Gemma 2 9B</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </div>

              <button 
                onClick={saveSettings}
                disabled={!keyInput.trim()}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-semibold py-3 rounded-xl transition-all mt-4 transform hover:scale-[1.02] active:scale-95 duration-200 shadow-lg shadow-orange-900/20 disabled:shadow-none"
              >
                Save & Continue
              </button>
              <div className="text-xs text-center text-slate-500 pt-3 border-t border-slate-800/80">
                Don't have an API key? <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 font-medium transition-colors hover:underline">Get one for free at Groq</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEFT PANEL: Chat Interface */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col border-r border-slate-800 bg-slate-900/50 z-10 transition-all">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-orange-500" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-white flex gap-1.5 items-center">
              VibeCoder <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-orange-400 inline-block uppercase tracking-wider relative top-[1px]">Groq</span>
            </h1>
          </div>
          <button 
            onClick={() => {
              setKeyInput(apiKey);
              setModelInput(selectedModel);
              setShowSettings(true);
            }}
            className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all active:scale-95"
            title="API Settings"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <div className="w-16 h-16 bg-gradient-to-tr from-orange-500/20 to-amber-500/5 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20 shadow-2xl shadow-orange-900/10">
                <Terminal className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Power Up With Groq</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-[280px]">
                Describe your dream UI component or app. Blazing fast reasoning models will generate it instantly.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/20 shadow-lg shadow-orange-900/10">
                    <Bot className="w-4 h-4 text-orange-400" />
                  </div>
                )}
                <div className={`px-4 py-3 max-w-[85%] text-[15px] leading-relaxed relative ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/20">
                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
              </div>
              <div className="px-5 py-3.5 bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          {error && (
             <div className="flex items-start gap-3 text-red-400 text-sm p-4 bg-red-950/30 rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-top-2">
               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> 
               <span className="leading-snug text-red-200/90">{error}</span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/80 z-20">
          <form onSubmit={handleSubmit} className="relative flex items-end bg-slate-900 border border-slate-700 focus-within:border-orange-500/70 focus-within:ring-4 focus-within:ring-orange-500/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg shadow-black/20">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); handleInputResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your app... (e.g. glassmorphism login)"
              className="w-full max-h-[250px] min-h-[56px] bg-transparent text-slate-100 placeholder-slate-500 p-4 pr-14 resize-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-700"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all duration-200 hover:shadow-lg disabled:hover:shadow-none hover:shadow-orange-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex justify-between items-center mt-3 px-1 text-[10px] uppercase font-medium tracking-wider text-slate-500">
            <span>Powered by Groq LPU</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Code & Preview */}
      <div className="flex-1 flex flex-col bg-[#0F111A] relative min-w-0 shadow-[-10px_0_30px_rgba(0,0,0,0.3)] z-20">
        {/* Tabs */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-[#0c0d14]">
          <div className="flex space-x-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'preview' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Play className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'code' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Code2 className="w-4 h-4" /> Code
            </button>
          </div>
          {activeTab === 'code' && currentCode && (
            <button onClick={copyCode} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-all active:scale-95 shadow-sm">
              {copied ? <Check className="w-4 h-4 text-orange-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden bg-[#0A0B10]">
          {!currentCode ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-[#0F111A]">
              <div className="p-6 bg-slate-900/50 rounded-full mb-6 border border-slate-800">
                <Code2 className="w-12 h-12 opacity-40 text-slate-400" />
              </div>
              <p className="font-medium text-slate-500">Your generated masterpiece will appear here</p>
            </div>
          ) : (
            <>
              <div className={`absolute inset-0 bg-white transition-opacity duration-300 ${activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                <iframe title="Preview" srcDoc={currentCode} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-modals" />
              </div>
              <div className={`absolute inset-0 overflow-auto p-6 transition-opacity duration-300 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                <pre className="text-[13px] font-mono text-slate-300 leading-relaxed font-medium">
                  <code>{currentCode}</code>
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}