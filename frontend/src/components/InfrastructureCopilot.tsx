import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  ShieldCheck,
  Bot,
  User,
  Database,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

interface CopilotProps {
  tenantId: string;
}

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  source?: string;
  facts?: any;
}

export const InfrastructureCopilot: React.FC<CopilotProps> = ({ tenantId }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: 'Hello, I am Third Eye Infrastructure Copilot. I am strictly grounded in live cluster facts, incident timelines, and safe remediation plans. I never hallucinate or invent metrics. What would you like to investigate?',
      source: 'ThirdEye-Grounded-Factual-Engine'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Why is cluster health currently in its state?',
    'Why was the active incident created and what is the root cause?',
    'Which infrastructure subsystems are currently impacted?',
    'What safe remediation should operators execute right now?',
    'Prove that no raw customer data or database records left the local boundary'
  ];

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askCopilot(q, tenantId);
      const copilotMsg: Message = {
        sender: 'copilot',
        text: res.answer,
        source: res.source,
        facts: res.grounded_facts
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: 'Unable to query live facts engine. Check backend connectivity.',
          source: 'Error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Grounded AI Assistant
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Infrastructure Copilot (Zero Hallucination Guaranteed)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Answers operational queries by anchoring strictly onto live telemetry, correlated causal graphs, and recommended actions. Gemini is only permitted to phrase answers—never invent numbers.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4" />
            GROUND TRUTH ANCHORED
          </div>
        </div>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer font-sans text-left"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'copilot' && (
                <div className="h-8 w-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              
              <div
                className={`max-w-2xl p-4 rounded-xl leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.source && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Engine: {m.source}</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Factual Grounding
                    </span>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 text-xs items-center text-slate-400">
              <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <span>Querying real-time fact base...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about cluster health, root cause causality, or safe remediation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
