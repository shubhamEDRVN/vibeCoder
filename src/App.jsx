import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Code2, Play, Terminal, User, Bot, Loader2, Sparkles, Copy, Check, Key, X, AlertCircle, Zap, Globe, Cpu, Layout, Paintbrush, Fingerprint, Code, Box, Layers, ChevronDown, Wand2 } from 'lucide-react';

const ARCHITECT_PROMPT = `You are an elite Product Manager and UX Architect.
The user will provide a simple idea for a web component or page.
Your task is to EXPAND this simple idea into a highly detailed, 2-3 paragraph architectural specification.

Focus on:
1. Core Aesthetics: (exact color palettes like 'slate-950 with emerald-500 accents', vibe, gradients, themes, dark/light mode)
2. Structural Layout: (Bento grids, asymmetrical layouts, sticky headers)
3. Micro-interactions: (hover:-translate-y-1, glassmorphism, scale variations)
4. Realism & Content: Describe exactly what realistic placeholder text and stock imagery (Unsplash) should be used.

DO NOT WRITE ANY CODE. Do not use markdown code blocks for HTML.
Write ONLY the detailed description of what the Engineer should build. Speak directly to the engineer.`;

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
- Typography: Implement strong typographic hierarchy. Headers should be bold and tightly tracked (e.g., text-4xl font-extrabold tracking-tight). Secondary text must be muted and highly legible.
- Components: Soft, modern styling is required: rounded corners (rounded-2xl, rounded-3xl), subtle borders (border border-white/10 or border-gray-200/50), and elegant layered shadows (shadow-sm, shadow-xl, hover:shadow-2xl).
- Colors: Avoid harsh default colors. Use sophisticated palettes (slate, zinc, neutral). Employ premium accent colors (e.g., emerald-500, indigo-500, violet-600) for primary actions and highlights. Use vibrant gradients carefully.
- Visual Flourishes: Implement modern UI trends heavily, including Glassmorphism (backdrop-blur-md bg-white/10 or bg-gray-900/40) for navbars and modal backgrounds.
- Realism: Fill the UI with highly realistic placeholder data. For images, use beautiful, thematic Unsplash source URLs (e.g., <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80">). Use UI Faces for avatars. Write engaging, real-world copy. DO NOT USE "Lorem Ipsum".
- Dark Mode: When applicable, use deep, rich dark themes (bg-slate-950 or bg-[#0a0a0a]), high-contrast text, and glowing accents.

INTERACTIVE EXPERIENCES (MANDATORY):
- Micro-interactions: EVERY interactive element MUST have smooth CSS transitions (transition-all duration-300 ease-out) and hover/focus states (hover:-translate-y-1, hover:scale-[1.02], hover:bg-opacity-90).
- JavaScript Functionality: Do not just build static shells. Provide robust Vanilla JavaScript inside a <script> tag at the end of the body to make the UI interactive. Implement working tabs, modals, carousels, accordions, toggles, form validations, and dynamic list interactions. Provide an impeccable UX.`;

const PROVIDERS = {
  groq: {
    id: 'groq',
    name: 'Groq',
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-500',
    border: 'border-orange-500/50',
    gradient: 'from-orange-600 to-amber-600',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
    ]
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: Sparkles,
    color: 'text-blue-500',
    bg: 'bg-blue-500',
    border: 'border-blue-500/50',
    gradient: 'from-blue-600 to-indigo-600',
    models: [
      { id: 'gemini-3.0-flash', name: 'Gemini 3.0 Flash' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ]
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: Globe,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500/50',
    gradient: 'from-emerald-600 to-teal-600',
    models: [
      { id: 'o3-mini', name: 'o3-mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
    ]
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: Cpu,
    color: 'text-violet-500',
    bg: 'bg-violet-500',
    border: 'border-violet-500/50',
    gradient: 'from-violet-600 to-fuchsia-600',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro' },
      { id: 'openai/gpt-4o', name: 'GPT-4o' }
    ]
  }
};

const detectProvider = (key) => {
  if (!key) return null;
  const trimmed = key.trim();
  if (trimmed.startsWith('gsk_')) return 'groq';
  if (trimmed.startsWith('AIza')) return 'gemini';
  if (trimmed.startsWith('sk-or-')) return 'openrouter';
  if (trimmed.startsWith('sk-')) return 'openai'; 
  return 'groq'; 
};

const fetchWithRetry = async (url, options, retries = 3) => {
  const delays = [2000, 5000, 10000];
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return await res.json();
      
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
  const [loadingState, setLoadingState] = useState(''); // '' | 'enhancing' | 'generating'
  const [currentCode, setCurrentCode] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Settings & Toggles
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('omniApiKey') || '');
  const [selectedProviderId, setSelectedProviderId] = useState(() => localStorage.getItem('omniProvider') || 'groq');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('omniModel') || 'llama-3.3-70b-versatile');
  const [isEnhanceEnabled, setIsEnhanceEnabled] = useState(true);
  
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('omniApiKey'));
  const [keyInput, setKeyInput] = useState(apiKey);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const activeProvider = PROVIDERS[selectedProviderId] || PROVIDERS.groq;

  useEffect(() => {
    if (showSettings) {
      const detected = detectProvider(keyInput);
      if (detected && detected !== selectedProviderId && PROVIDERS[detected]) {
        setSelectedProviderId(detected);
        setSelectedModel(PROVIDERS[detected].models[0].id);
      }
    }
  }, [keyInput, showSettings, selectedProviderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingState]);

  const handleInputResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const saveSettings = () => {
    const trimmed = keyInput.trim();
    setApiKey(trimmed);
    localStorage.setItem('omniApiKey', trimmed);
    localStorage.setItem('omniProvider', selectedProviderId);
    localStorage.setItem('omniModel', selectedModel);
    setShowSettings(false);
  };

  const extractCode = (text) => {
    const fence = '`' + '`' + '`';
    const regex = new RegExp(fence + "(?:html)?\\n([\\s\\S]*?)" + fence);
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  // Reusable core engine caller
  const callLLMEngine = async (chatMessages, systemPromptString, appendedContext = '') => {
      let url, headers, bodyPayload;
      
      if (activeProvider.id === 'gemini') {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
        headers = { 'Content-Type': 'application/json' };
        
        const geminiContents = chatMessages.map(msg => ({
          role: msg.role === 'ai' || msg.role === 'architect' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));
        
        if (appendedContext) {
            const lastMsg = geminiContents[geminiContents.length - 1];
            lastMsg.parts[0].text = `${appendedContext}\n\n${lastMsg.parts[0].text}`;
        }

        bodyPayload = {
          contents: geminiContents,
          systemInstruction: { parts: [{ text: systemPromptString }] }
        };
      } else {
         const endpointMap = {
           groq: 'https://api.groq.com/openai/v1/chat/completions',
           openrouter: 'https://openrouter.ai/api/v1/chat/completions',
           openai: 'https://api.openai.com/v1/chat/completions'
         };
         url = endpointMap[activeProvider.id];
         headers = { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${apiKey}`
         };
         
         if (activeProvider.id === 'openrouter') {
            headers['HTTP-Referer'] = window.location.href; 
            headers['X-Title'] = 'VibeCoder Omni';
         }

         const formattedMessages = [{ role: 'system', content: systemPromptString }];
         chatMessages.forEach((msg, index) => {
            if (index === chatMessages.length - 1) return;
            formattedMessages.push({
              role: msg.role === 'ai' || msg.role === 'architect' ? 'assistant' : 'user',
              content: msg.content
            });
         });

         let finalContext = chatMessages[chatMessages.length - 1].content;
         if (appendedContext) {
             finalContext = `${appendedContext}\n\n${finalContext}`;
         }
         formattedMessages.push({ role: 'user', content: finalContext });

         bodyPayload = {
            model: selectedModel,
            messages: formattedMessages,
            temperature: 0.2
         };
      }

      const data = await fetchWithRetry(url, { method: 'POST', headers, body: JSON.stringify(bodyPayload) });
      const responseText = activeProvider.id === 'gemini' 
        ? data.candidates?.[0]?.content?.parts?.[0]?.text 
        : data.choices?.[0]?.message?.content;
        
      if (!responseText) throw new Error("Received empty response from API.");
      return responseText;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loadingState !== '') return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const originalInput = input;
    const userMessage = { role: 'user', content: originalInput };
    let currentConversation = [...messages, userMessage];
    
    setMessages(currentConversation);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setError(null);

    try {
      let finalGenerationPrompt = originalInput;

      // === PHASE 1: Auto-Enhance Architect ===
      if (isEnhanceEnabled) {
         setLoadingState('enhancing');
         const architectResponse = await callLLMEngine([{ role: 'user', content: `Enhance this idea: ${originalInput}` }], ARCHITECT_PROMPT);
         
         // Display Architect's output to user
         const enhancedMessage = { role: 'architect', content: architectResponse };
         currentConversation = [...currentConversation, enhancedMessage];
         setMessages(currentConversation);
         
         // We use the full enhanced response as the new command for the Code Generator
         finalGenerationPrompt = `I need you to build exactly this specification:\n\n${architectResponse}`;
      }

      // === PHASE 2: Code Generation ===
      setLoadingState('generating');
      // Pass the conversation but replace the last user intent with the potentially Enhanced prompt
      const generatorMessages = [...currentConversation, { role: 'user', content: finalGenerationPrompt }];
      
      const contextBlocks = `${currentCode ? `Current Source Code:\n\`\`\`html\n${currentCode}\n\`\`\`\n\n` : ''}`;
      
      const responseText = await callLLMEngine(generatorMessages, SYSTEM_PROMPT, contextBlocks);

      const extractedCode = extractCode(responseText);
      const fence = '`' + '`' + '`';
      const replaceRegex = new RegExp(fence + "(?:html)?\\n[\\s\\S]*?" + fence);
      const cleanMessage = responseText.replace(replaceRegex, '').trim() 
        || "I've generated the code for you. Check the preview panel!";

      setMessages(prev => [...prev, { role: 'ai', content: cleanMessage }]);
      
      if (extractedCode) {
        setCurrentCode(extractedCode);
        setActiveTab('preview');
      }

    } catch (err) {
      console.warn("API Request Failed:", err.message);
      
      if (err.message && err.message.includes('401')) {
         setError(`Invalid ${activeProvider.name} API Key. Please verify settings.`);
         setShowSettings(true);
      } else if (err.message && err.message.includes('404')) {
         setError(`Model not found. ${activeProvider.name} may have updated their models.`);
         setShowSettings(true);
      } else if (err.message && err.message.includes('429')) {
         setError(`Rate Limit Exceeded for ${activeProvider.name}. Please wait a minute.`);
      } else {
         setError(err.message || "Failed to generate response. Check your API key or network.");
      }
    } finally {
      setLoadingState('');
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

  const ProviderIcon = activeProvider.icon;

  return (
    <div className={`flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden ${activeProvider.color}`}>
      
      {/* Settings Modal (Connections Command Center) */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-[500px] bg-slate-900 border border-slate-700/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 mb-10 transition-all relative overflow-hidden">
            <div className={`absolute top-0 right-0 -m-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${activeProvider.bg}`}></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <Box className="w-6 h-6 text-indigo-400" /> Omni-Connections
              </h2>
              {apiKey && (
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">1. Paste API Key</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="gsk_..., AIza..., sk-..."
                    className="w-full bg-slate-950/50 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 transition-all font-mono placeholder:font-sans shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 ml-1">Auto-detects Groq, Gemini, OpenAI, & OpenRouter.</p>
              </div>
              
              <div className="flex gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 items-center">
                <div className={`p-3 rounded-xl ${activeProvider.bg} bg-opacity-20`}>
                  <ProviderIcon className={`w-6 h-6 ${activeProvider.color}`} />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Engine</span>
                  <div className="font-bold text-white text-lg tracking-tight">{activeProvider.name}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">2. Select Model</label>
                <div className="relative group">
                  <Layers className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={`w-full bg-slate-950/50 border border-slate-700/80 rounded-2xl pl-12 pr-10 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 appearance-none transition-all cursor-pointer font-medium`}
                  >
                    {activeProvider.models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <button 
                onClick={saveSettings}
                disabled={!keyInput.trim()}
                className={`w-full bg-gradient-to-r ${activeProvider.gradient} hover:brightness-110 disabled:grayscale disabled:opacity-50 text-white font-bold tracking-wide py-4 rounded-2xl transition-all mt-4 transform hover:scale-[1.02] active:scale-95 duration-200 shadow-[0_0_20px_rgba(0,0,0,0.3)] shadow-${activeProvider.color.replace('text-','')}/30`}
              >
                Engage System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT PANEL: Chat Interface */}
      <div className="w-full md:w-[400px] lg:w-[450px] xl:w-[500px] flex flex-col border-r border-slate-800/60 bg-slate-900/40 z-10 transition-all flex-shrink-0">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 bg-slate-800/80 rounded-lg border ${activeProvider.border} shadow-[0_0_10px_currentColor] ${activeProvider.color} shadow-opacity-20`}>
              <ProviderIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-[15px] tracking-tight text-white leading-tight">
                VibeCoder <span className="font-normal text-slate-400">Omni</span>
              </h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${activeProvider.color}`}>
                {activeProvider.name}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className={`p-2.5 text-slate-400 hover:${activeProvider.color} hover:bg-slate-800 rounded-xl transition-all active:scale-95`}
            title="Connections"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700/50">
          {messages.length === 0 ? (
            <div className="flex flex-col justify-center h-full px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              <div className="mb-8">
                <div className={`inline-flex items-center justify-center p-4 rounded-2xl mb-4 bg-gradient-to-tr ${activeProvider.gradient} shadow-lg shadow-black/20 text-white`}>
                  <Paintbrush className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Design Anything.</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                  Powered by {activeProvider.name} and {activeProvider.models.find(m => m.id === selectedModel)?.name || 'elite modeling'}. Describe the component or layout you wish to summon.
                </p>
              </div>

              {/* Bento Grid Empty State */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  { text: "Bento Grid Dashboard with glassmorphism", icon: Layout },
                  { text: "Modern Pricing Table with hover effects", icon: Zap },
                  { text: "Bio Link Page with dark mode gradients", icon: Fingerprint },
                  { text: "SaaS Hero Section with email capture", icon: Code }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(item.text)}
                    className="p-4 text-left bg-slate-800/30 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600 rounded-2xl transition-all duration-300 group flex flex-col gap-3 hover:-translate-y-1 hover:shadow-xl shadow-black/10"
                  >
                    <item.icon className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                    <span className="text-xs text-slate-300 font-medium leading-snug">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  
                  {/* Avatar handling */}
                  {(msg.role === 'ai' || msg.role === 'architect') && (
                    <div className={`w-8 h-8 rounded-full ${msg.role === 'architect' ? 'bg-indigo-500' : activeProvider.bg} bg-opacity-10 flex items-center justify-center flex-shrink-0 border ${msg.role === 'architect' ? 'border-indigo-500/50' : activeProvider.border} shadow-lg shadow-black/20 mt-1`}>
                      {msg.role === 'architect' ? <Wand2 className="w-4 h-4 text-indigo-400" /> : <ProviderIcon className={`w-4 h-4 ${activeProvider.color}`} />}
                    </div>
                  )}
                  
                  {/* Bubble styling */}
                  <div className={`px-4 py-3 max-w-[85%] text-[14px] leading-relaxed relative ${
                    msg.role === 'user' 
                      ? `bg-gradient-to-br ${activeProvider.gradient} text-white rounded-2xl rounded-tr-sm shadow-md` 
                    : msg.role === 'architect'
                      ? 'bg-indigo-950/40 text-indigo-100 border border-indigo-500/30 rounded-2xl rounded-tl-sm backdrop-blur-sm shadow-xl font-medium'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-sm backdrop-blur-sm shadow-lg'
                  }`}>
                    {msg.role === 'architect' && (
                      <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Auto-Enhance Blueprint</div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {loadingState !== '' && (
            <div className="flex gap-3 justify-start animate-in fade-in pb-4">
              <div className={`w-8 h-8 rounded-full ${loadingState === 'enhancing' ? 'bg-indigo-500 border-indigo-500/50' : activeProvider.bg + ' ' + activeProvider.border} bg-opacity-10 flex items-center justify-center flex-shrink-0 border mt-1`}>
                <Loader2 className={`w-4 h-4 ${loadingState === 'enhancing' ? 'text-indigo-400' : activeProvider.color} animate-spin`} />
              </div>
              <div className={`px-5 py-4 bg-slate-800/80 border ${loadingState === 'enhancing' ? 'border-indigo-500/30 shadow-indigo-500/10' : 'border-slate-700/50'} rounded-2xl rounded-tl-sm backdrop-blur-sm flex items-center gap-3 shadow-lg`}>
                <div className="flex gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${loadingState === 'enhancing' ? 'bg-indigo-500' : activeProvider.bg} animate-pulse`} style={{ animationDelay: '0ms' }}></span>
                  <span className={`w-2 h-2 rounded-full ${loadingState === 'enhancing' ? 'bg-indigo-500' : activeProvider.bg} animate-pulse`} style={{ animationDelay: '150ms' }}></span>
                  <span className={`w-2 h-2 rounded-full ${loadingState === 'enhancing' ? 'bg-indigo-500' : activeProvider.bg} animate-pulse`} style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className={`text-xs font-semibold tracking-wider uppercase ${loadingState === 'enhancing' ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {loadingState === 'enhancing' ? 'Architecting Layout...' : 'Writing Code...'}
                </span>
              </div>
            </div>
          )}
          {error && (
             <div className="flex items-start gap-3 text-red-400 text-sm p-4 bg-red-950/40 rounded-2xl border border-red-500/30 animate-in fade-in slide-in-from-top-2 backdrop-blur-sm shadow-xl mt-4">
               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> 
               <span className="leading-snug text-red-200/90">{error}</span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950/80 backdrop-blur-2xl border-t border-slate-800/80 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
          
          {/* Enhancement Toggle */}
          <div className="flex items-center justify-end mb-2 px-1">
             <button 
               onClick={() => setIsEnhanceEnabled(!isEnhanceEnabled)}
               className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-colors ${
                 isEnhanceEnabled ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-slate-500 bg-slate-800/50 hover:bg-slate-800'
               }`}
             >
               <Wand2 className="w-3 h-3" /> Auto-Enhance {isEnhanceEnabled ? 'On' : 'Off'}
             </button>
          </div>

          <form onSubmit={handleSubmit} className={`relative flex items-end bg-slate-900 border border-slate-700/80 focus-within:border-${activeProvider.color.replace('text-','')} focus-within:ring-4 focus-within:ring-${activeProvider.bg.replace('bg-','')}/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl shadow-black/20`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); handleInputResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your interface..."
              className="w-full max-h-[250px] min-h-[60px] bg-transparent text-slate-100 placeholder-slate-500 p-4 pr-16 resize-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-700"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || loadingState !== ''}
              className={`absolute right-2 bottom-2 p-2.5 bg-gradient-to-r ${activeProvider.gradient} disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-95 disabled:active:scale-100 disabled:hover:shadow-none hover:shadow-${activeProvider.color.replace('text-','')}/30`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex justify-between items-center mt-3 px-2 text-[10px] uppercase font-bold tracking-widest text-slate-600">
            <span>{activeProvider.models.find(m=>m.id===selectedModel)?.name}</span>
            <span>Shift + Enter ↵</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Code & Preview */}
      <div className="flex-1 flex flex-col bg-[#0A0B10] relative min-w-0 z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        {/* Tabs */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950 backdrop-blur-md z-30">
          <div className="flex space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800/60 shadow-inner">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'preview' ? 'bg-slate-700/50 text-white shadow-md border border-slate-600/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Play className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'code' ? 'bg-slate-700/50 text-white shadow-md border border-slate-600/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Code2 className="w-4 h-4" /> /code
            </button>
          </div>
          {activeTab === 'code' && currentCode && (
            <button onClick={copyCode} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600/50 transition-all active:scale-95 shadow-lg group`}>
              {copied ? <Check className={`w-4 h-4 ${activeProvider.color}`} /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden bg-slate-950/20">
          {!currentCode ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-[#0A0B10] select-none">
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                <div className="p-8 bg-slate-900/80 rounded-[2rem] mb-6 border border-slate-800/80 shadow-2xl relative z-10 backdrop-blur-xl transform transition-transform duration-500 group-hover:scale-105">
                  <Code className="w-16 h-16 opacity-40 text-slate-300" />
                </div>
              </div>
              <p className="font-semibold text-slate-500 tracking-wide">Waiting for architectural instructions...</p>
            </div>
          ) : (
            <>
              <div className={`absolute inset-0 bg-white transition-all duration-500 ease-in-out ${activeTab === 'preview' ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95 pointer-events-none'}`}>
                <iframe title="Preview" srcDoc={currentCode} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-modals" />
              </div>
              <div className={`absolute inset-0 overflow-auto p-8 transition-all duration-500 ease-in-out bg-[#0A0B10] ${activeTab === 'code' ? 'opacity-100 z-10 translate-y-0' : 'opacity-0 z-0 translate-y-4 pointer-events-none'}`}>
                <div className="max-w-4xl mx-auto bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 shadow-2xl backdrop-blur-sm">
                  <pre className="text-[13px] font-mono text-slate-300 leading-relaxed font-medium">
                    <code>{currentCode}</code>
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}