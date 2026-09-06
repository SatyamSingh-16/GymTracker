import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, RotateCcw, Dumbbell, ChevronRight, Bot } from 'lucide-react';
import { aiApi } from '../../api/endpoints';
import type { AICoachResponse } from '../../api/endpoints';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  suggestedPrompts?: string[];
  relatedExercises?: string[];
}

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STARTER_PROMPTS = [
  'Which is the best chest workout?',
  'Analyze my workout volume',
  'How to break a bench press plateau?',
  'Optimal daily protein recommendations',
];

export const AICoachModal: React.FC<AICoachModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### 👋 Hey Lifter! I'm your GymTracker AI Coach

Ask me anything about **targeted muscle routines**, **hypertrophy biomechanics**, **overcoming plateaus**, or tap **"Analyze my workout volume"** to get personalized feedback based on your logged workouts.

What are we training or optimizing today?`,
      suggestedPrompts: STARTER_PROMPTS,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open without forcing scroll
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsgId = String(Date.now());
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Scroll to show the user message and typing indicator
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 50);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res: AICoachResponse = await aiApi.chat({
        message: textToSend.trim(),
        history,
      });

      const assistantMsgId = String(Date.now() + 1);
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: res.reply,
        source: res.source,
        suggestedPrompts: res.suggested_prompts,
        relatedExercises: res.related_exercises,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Gently scroll to the START of the new AI reply so the user can read from top
      setTimeout(() => {
        const replyEl = document.getElementById(`msg-${assistantMsgId}`);
        if (replyEl) {
          replyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      const errorMsgId = String(Date.now() + 1);
      const errorMessage: ChatMessage = {
        id: errorMsgId,
        role: 'assistant',
        content: `⚠️ **Unable to connect to coach:** ${err.message || 'Please check your connection and try again.'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `### 🔄 Chat cleared. What would you like to explore next?`,
        suggestedPrompts: STARTER_PROMPTS,
      },
    ]);
  };

  // Helper to format basic markdown (headers, bold, bullet points)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Heading 3
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-base font-black text-white pt-1 pb-0.5 tracking-tight flex items-center gap-2">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          // Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const rawText = trimmed.replace(/^(\*|-)\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 text-slate-300">
                <span className="text-white/60 font-bold shrink-0 mt-0.5">•</span>
                <span>{renderInlineFormatting(rawText)}</span>
              </div>
            );
          }

          // Numbered lists
          if (/^\d+\.\s+/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+\.)\s+/);
            const numPrefix = numMatch ? numMatch[1] : '1.';
            const rawText = trimmed.replace(/^\d+\.\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 text-slate-200 mt-2 font-medium">
                <span className="text-white font-bold shrink-0">{numPrefix}</span>
                <div>{renderInlineFormatting(rawText)}</div>
              </div>
            );
          }

          return (
            <p key={idx} className="text-slate-300">
              {renderInlineFormatting(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // Inline bold parser
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Mobile-only light backdrop */}
      <div
        className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Docked AI Chat Drawer in Bottom-Right Corner */}
      <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[450px] h-[82vh] sm:h-[590px] flex flex-col rounded-t-[32px] sm:rounded-[32px] bg-[#0c0e15]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-250">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-black border border-white/20 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">GymTracker AI</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Strength Coach & Routine Advisor</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Reset conversation"
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close drawer"
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] px-5 py-3 rounded-[22px] rounded-br-sm bg-white/15 text-white border border-white/20 text-sm font-medium shadow-md">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[95%] space-y-3">
                  <div className="p-4 sm:p-5 rounded-[24px] rounded-tl-sm bg-white/[0.04] border border-white/10 shadow-lg space-y-2">
                    {renderFormattedContent(msg.content)}

                    {/* Source tag */}
                    {msg.source && (
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Powered by {msg.source}</span>
                      </div>
                    )}
                  </div>

                  {/* Related Exercises tags */}
                  {msg.relatedExercises && msg.relatedExercises.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pl-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" /> Related:
                      </span>
                      {msg.relatedExercises.map((ex) => (
                        <span
                          key={ex}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/[0.06] border border-white/15 text-slate-300"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Follow-up suggestion pills */}
                  {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div className="space-y-1.5 pt-1 pl-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Suggested questions
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {msg.suggestedPrompts.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSend(prompt)}
                            className="text-left text-xs px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span>{prompt}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10 max-w-[140px]">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask coach (e.g. best chest routine, break plateau)..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-full text-sm glass-input text-white placeholder-slate-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-3 rounded-full bg-white text-black font-bold hover:bg-slate-200 transition-all shadow-pill-white disabled:opacity-40 disabled:cursor-not-allowed btn-white shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-black !text-black" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
