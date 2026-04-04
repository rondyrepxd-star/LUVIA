"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Archive, History, ChevronDown, Trash2, Pencil, X } from 'lucide-react';
import { studyAssistantChat } from '@/ai/flows/study-assistant-chat-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChatMessage, ChatSession } from '@/app/page';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';

interface ChatViewProps {
  noteContent: string;
  history: ChatMessage[];
  setHistory: (history: ChatMessage[]) => void;
  pastSessions: ChatSession[];
  setPastSessions: (sessions: ChatSession[]) => void;
}

const ChatView = ({ noteContent, history, setHistory, pastSessions, setPastSessions }: ChatViewProps) => {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const initialAssistantMessage: ChatMessage = { 
    role: 'assistant', 
    content: 'Hello! I am Luvia, your AI study assistant. Ask me anything about your current notes.' 
  };

  const messages = history.length > 0 ? history : [initialAssistantMessage];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Helper to clean HTML from notes before sending to AI
  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newHistoryWithUser = [...messages, { role: 'user', content: userMessage } as ChatMessage];
    setHistory(newHistoryWithUser);
    setIsLoading(true);

    try {
      const response = await studyAssistantChat({
        chatMessage: userMessage,
        studyMaterial: stripHtml(noteContent),
        history: messages.map(m => ({ 
          role: m.role as 'user' | 'assistant', 
          content: m.content 
        }))
      });
      setHistory([...newHistoryWithUser, { role: 'assistant', content: response.response } as ChatMessage]);
    } catch (error: any) {
      const errorMessage = error.message?.includes('QUOTA') 
        ? "I'm a bit busy right now (Quota exceeded). Please wait a few seconds and try again!" 
        : "I'm sorry, I encountered an error. Please try again.";
      setHistory([...newHistoryWithUser, { role: 'assistant', content: errorMessage } as ChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = () => {
    if (history.length <= 1) {
      toast({
        title: "Session is empty",
        description: "Nothing to archive yet.",
      });
      return;
    }

    const timestamp = Date.now();
    const dateString = new Date(timestamp).toLocaleString();
    const firstUserQuery = history.find(m => m.role === 'user')?.content.substring(0, 30) || "Empty Chat";
    
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(2, 9),
      title: `Session: ${firstUserQuery}... (${dateString})`,
      messages: [...history],
      timestamp
    };

    setPastSessions([newSession, ...pastSessions]);
    setHistory([]);
    
    toast({
      title: "Session Archived",
      description: "Chat history has been saved to your library.",
    });
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPastSessions(pastSessions.filter(s => s.id !== id));
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setPastSessions(pastSessions.map(s => 
      s.id === id ? { ...s, title: newTitle || 'Untitled Session' } : s
    ));
    setEditingSessionId(null);
  };

  const handleDeleteMessage = (index: number) => {
    const newHistory = [...history];
    newHistory.splice(index, 1);
    setHistory(newHistory);
    toast({
      description: "Message removed from current session.",
    });
  };

  return (
    <div className="flex flex-col h-full bg-background w-full">
      {/* Sessions Header */}
      <div className="p-4 border-b border-border bg-card/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground italic">History</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleEndSession}
          className="gap-2 font-black text-[10px] uppercase tracking-widest h-8 border-primary/20 hover:bg-primary/5 text-primary"
        >
          <Archive size={14} />
          End Session
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="w-full">
          {/* Past Sessions Accordion */}
          {pastSessions.length > 0 && (
            <div className="mb-12">
              <Accordion type="single" collapsible className="w-full space-y-2">
                {pastSessions.map((session) => (
                  <AccordionItem key={session.id} value={session.id} className="border border-border/40 rounded-xl overflow-hidden bg-card/50">
                    <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/30 transition-all text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      <div className="flex items-center justify-between w-full pr-4">
                        {editingSessionId === session.id ? (
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleRenameSession(session.id, editingTitle)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSession(session.id, editingTitle);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 text-[10px] bg-background border-primary/30 px-2 flex-1 mr-2 font-bold uppercase"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate max-w-[400px]">{session.title}</span>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div 
                            role="button"
                            aria-label="Edit session name"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(session.id);
                              setEditingTitle(session.title);
                            }}
                            className="p-1.5 hover:text-primary transition-colors"
                          >
                            <Pencil size={12} />
                          </div>
                          <div 
                            role="button"
                            aria-label="Delete session"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1.5 hover:text-destructive transition-colors"
                          >
                            <Trash2 size={12} />
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 space-y-4 bg-background/50">
                      {session.messages.map((m, i) => (
                        <div key={i} className={cn(
                          "flex gap-3",
                          m.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}>
                          <div className={cn(
                            "max-w-[85%] rounded-xl p-3 text-[11px] leading-relaxed",
                            m.role === 'assistant' ? "bg-card border border-border" : "bg-primary/10 text-primary border border-primary/20"
                          )}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black my-8">
                <div className="h-px bg-border flex-1" />
                <span>Current Session</span>
                <div className="h-px bg-border flex-1" />
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={cn(
                "flex gap-4 group/msg",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <Avatar className={cn(
                  "w-8 h-8",
                  m.role === 'assistant' ? "bg-primary" : "bg-sidebar-accent"
                )}>
                  <AvatarFallback>
                    {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "max-w-[80%] flex items-center gap-2",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "rounded-2xl p-4 text-sm shadow-sm",
                    m.role === 'assistant' ? "bg-card border border-border" : "bg-primary text-primary-foreground"
                  )}>
                    {m.content}
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={() => handleDeleteMessage(i)}
                      className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover/msg:opacity-100 transition-opacity"
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="w-8 h-8 bg-primary">
                  <AvatarFallback><Bot size={16} /></AvatarFallback>
                </Avatar>
                <div className="bg-card border border-border rounded-2xl p-4 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>
      </ScrollArea>

      <div className="p-6 border-t border-border bg-card">
        <div className="w-full">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Luvia anything..."
              className="pr-12 py-6 bg-background border-border rounded-xl focus-visible:ring-primary shadow-inner"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95"
            >
              <Send size={18} />
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-2 uppercase tracking-widest font-black">Powered by Luvia AI</p>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
