"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FileText, X, Command, Sparkles } from 'lucide-react';
import { StudyNote } from '@/app/page';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  notes: StudyNote[];
  onSelectNote: (id: string) => void;
}

const GlobalSearch = ({ isOpen, onClose, notes, onSelectNote }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '');
  };

  const getSnippet = (content: string, q: string) => {
    if (!q.trim()) return null;
    const text = stripHtml(content);
    const index = text.toLowerCase().indexOf(q.toLowerCase());
    if (index === -1) return null;
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + q.length + 50);
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    return snippet;
  };

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return notes.slice(0, 5);

    return notes.filter(n => {
      const titleMatch = n.title.toLowerCase().includes(q);
      const contentMatch = stripHtml(n.content).toLowerCase().includes(q);
      return titleMatch || contentMatch;
    }).slice(0, 10);
  }, [notes, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        onSelectNote(results[selectedIndex].id);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="w-full max-w-2xl bg-[#161616] border border-white/10 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        <div className="p-5 border-b border-white/5 flex items-center gap-4">
          <Search size={20} className="text-primary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, concepts, or intelligence..."
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-white placeholder:text-white/20"
          />
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">CTRL+K</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <ScrollArea className="max-h-[400px]">
          {results.length > 0 ? (
            <div className="p-3">
              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">Recent & Matches</p>
              {results.map((note, idx) => {
                const snippet = getSnippet(note.content, query);
                const isTitleMatch = note.title.toLowerCase().includes(query.toLowerCase());

                return (
                  <div
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all",
                      selectedIndex === idx ? "bg-primary text-primary-foreground shadow-xl" : "hover:bg-white/5 text-white/60"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      selectedIndex === idx ? "bg-white/20" : "bg-white/5 border border-white/5"
                    )}>
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate text-sm">{note.title}</h4>
                      {snippet && (!isTitleMatch || query.length > 3) && (
                        <p className={cn(
                          "text-[11px] font-medium truncate mt-0.5 opacity-80 italic",
                          selectedIndex === idx ? "text-white" : "text-primary/70"
                        )}>
                          {snippet}
                        </p>
                      )}
                      <p className={cn(
                        "text-[9px] truncate uppercase tracking-widest font-black italic mt-1",
                        selectedIndex === idx ? "text-white/70" : "text-white/20"
                      )}>
                        Last modified {new Date(note.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                    {note.quiz && <Sparkles size={14} className={cn(selectedIndex === idx ? "text-white" : "text-primary")} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10">
                <Search size={32} />
              </div>
              <p className="text-sm font-medium text-white/40">No results found for "{query}"</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.1em] text-white/20">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-white/40">ENTER</span> SELECT</span>
            <span className="flex items-center gap-1.5"><span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-white/40">↑↓</span> NAVIGATE</span>
          </div>
          <span>Luvia Search v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
