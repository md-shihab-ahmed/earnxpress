'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface WorkspaceChatProps {
  taskId: string;
  workerId: string;
  buyerId: string;
  peerName?: string;
  defaultExpanded?: boolean;
}

export function WorkspaceChat({
  taskId,
  workerId,
  buyerId,
  peerName = 'Counterparty',
  defaultExpanded = true,
}: WorkspaceChatProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThread = async () => {
    if (!taskId || !workerId || !buyerId) return;
    try {
      const data = await api.getPrivateSlotThread(taskId, workerId, buyerId);
      if (data) {
        setConversationId(data.id);
        setMessages(data.messages || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchThread();
    const interval = setInterval(fetchThread, 15000);
    return () => clearInterval(interval);
  }, [taskId, workerId, buyerId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await api.sendChatMessage(conversationId, content);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
      } else {
        await fetchThread();
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-navy-900/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Workspace Direct Chat • {peerName}
              {messages.length > 0 && (
                <span className="text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-400 px-2 py-0.2 rounded-full">
                  {messages.length}
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              Direct communication for instructions, deliverables, and clarifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Chat Body */}
      {isOpen && (
        <div className="flex flex-col h-80">
          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-navy-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-1">
                <MessageSquare className="w-7 h-7 text-slate-400 stroke-[1.5]" />
                <p className="text-xs font-medium">No messages in this workspace yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Ask questions, coordinate requirements, or confirm submission details directly.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = user?.id ? m.senderId === user.id : false;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {isMe ? 'You' : m.sender?.profile?.displayName || peerName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-teal-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-navy-700 rounded-bl-none'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message to buyer/worker..."
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim() || !conversationId}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
