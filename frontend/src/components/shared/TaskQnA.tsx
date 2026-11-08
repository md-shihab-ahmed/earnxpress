'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Loader2, ShieldCheck, HelpCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    primaryRole: string;
    profile?: {
      displayName?: string;
    };
  };
}

interface TaskQnAProps {
  taskId: string;
  buyerId?: string;
}

export function TaskQnA({ taskId, buyerId }: TaskQnAProps) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newContent, setNewContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    try {
      const res = await api.getTaskQnA(taskId);
      setMessages(res.messages || []);
    } catch {
      // Quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [taskId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await api.postTaskQnA(taskId, newContent.trim());
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setNewContent('');
      } else {
        setError('Failed to post question. Please verify your connection.');
      }
    } catch {
      setError('An error occurred while posting your question.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Task Q&A & Clarifications
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          Public thread • Visible to all participants
        </span>
      </div>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading discussion...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium">No questions asked yet.</p>
            <p className="text-xs text-slate-400">
              Have questions about deliverables or criteria? Ask the buyer below.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.map((m) => {
              const isBuyerMsg = buyerId && m.senderId === buyerId;
              const senderName = m.sender.profile?.displayName || m.sender.email.split('@')[0];

              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-lg border text-sm ${
                    isBuyerMsg
                      ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {senderName[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {senderName}
                      </span>
                      {isBuyerMsg && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                          Task Creator
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap pl-8">
                    {m.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Input */}
        {isAuthenticated ? (
          <form onSubmit={handleSend} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={
                  user?.id === buyerId
                    ? 'Post an official answer or instruction clarification...'
                    : 'Ask the buyer a question about deliverables...'
                }
                className="flex-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSending || !newContent.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-center text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Please sign in to ask questions on this public thread.
          </p>
        )}
      </div>
    </div>
  );
}
