"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, Plus, Pencil, Trash2, ArrowLeft, 
  CheckCircle, ChevronRight, ChevronLeft, X, 
  CircleDot, Target, TextCursorInput, 
  ListOrdered, Columns2, ArrowRightLeft,
  Eye, Search, Sparkles, BookOpen,
  LayoutGrid, Layers, Trash, Zap
} from 'lucide-react';
import { StudyNote } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import NoteIcon from './NoteIcon';

export const MasterQuizView = ({ 
  notes, 
  folders, 
  onSelectNote, 
  onStartMasterQuiz 
}: { 
  notes: StudyNote[], 
  folders: any[], 
  onSelectNote: (id: string, tab: 'Quiz') => void,
  onStartMasterQuiz?: (selectedNotes: string[]) => void
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [presets, setPresets] = useState<{name: string, questions: string[]}[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    const savedPresets = localStorage.getItem('master-quiz-presets');
    if (savedPresets) setPresets(JSON.parse(savedPresets));
  }, []);

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset = { name: newPresetName, questions: Array.from(selectedQuestions) };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('master-quiz-presets', JSON.stringify(updated));
    setNewPresetName('');
    setShowSavePreset(false);
  };

  const loadPreset = (questions: string[]) => {
    setSelectedQuestions(new Set(questions));
  };

  const toggleQuestion = (noteId: string, qIdx: number) => {
    const id = `${noteId}:${qIdx}`;
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedQuestions(newSelected);
  };

  const toggleNote = (noteId: string, questions: any[]) => {
    const newSelected = new Set(selectedQuestions);
    const allIds = questions.map((_, idx) => `${noteId}:${idx}`);
    const allSelected = allIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      allIds.forEach(id => newSelected.delete(id));
    } else {
      allIds.forEach(id => newSelected.add(id));
    }
    setSelectedQuestions(newSelected);
  };

  const notesWithQuizzes = useMemo(() => {
    return notes.filter(n => n.quiz && n.quiz.quiz && n.quiz.quiz.length > 0);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notesWithQuizzes;
    const q = searchQuery.toLowerCase();
    return notesWithQuizzes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [notesWithQuizzes, searchQuery]);

  const getFolderName = (folderId?: string) => {
    if (!folderId) return 'Root';
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Unknown';
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'multiple_choice': return <CircleDot size={12} />;
      case 'true_false': return <Target size={12} />;
      case 'fill_in_blank': return <TextCursorInput size={12} />;
      case 'short_answer': return <Pencil size={12} />;
      case 'matching': return <ArrowRightLeft size={12} />;
      case 'ordering': return <ListOrdered size={12} />;
      case 'flashcard': return <Columns2 size={12} />;
      case 'reveal': return <Eye size={12} />;
      default: return <Plus size={12} />;
    }
  };

  const startMasterQuiz = () => {
    if (onStartMasterQuiz && selectedQuestions.size > 0) {
      onStartMasterQuiz(Array.from(selectedQuestions));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d0f] animate-in fade-in duration-500 text-left relative overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-white/5 space-y-6 bg-[#0d0d0f]/80 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20 shadow-2xl">
              <Zap size={24} className="fill-primary/20" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Master Quiz Lab</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic mt-1 uppercase tracking-widest text-primary/60">
                {selectedQuestions.size} Questions Selected / {notesWithQuizzes.length} Notes Loaded
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Presets UI */}
            <div className="flex items-center gap-2 mr-2">
              {presets.length > 0 && (
                <select 
                  className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold uppercase text-white/60 outline-none hover:border-primary/30 transition-all cursor-pointer h-11"
                  onChange={(e) => {
                    const p = presets.find(p => p.name === e.target.value);
                    if (p) loadPreset(p.questions);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Load Preset...</option>
                  {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePreset(true)}
                className="bg-white/5 border-white/10 text-[10px] font-bold uppercase h-11 rounded-xl hover:bg-white/10"
                disabled={selectedQuestions.size === 0}
              >
                Save
              </Button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Quizzes..." 
                className="w-64 h-11 bg-white/5 border-white/10 rounded-xl px-12 text-white font-black uppercase italic text-xs"
              />
            </div>
            <Button 
              onClick={startMasterQuiz}
              disabled={selectedQuestions.size === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic tracking-tighter gap-3 px-8 h-11 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <Play size={18} fill="currentColor" /> Start Master Session
            </Button>
          </div>
        </div>
      </div>

      {/* Preset Modal */}
      {showSavePreset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSavePreset(false)} />
          <div className="relative bg-[#141416] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-6">Name your selection</h3>
            <Input 
              placeholder="e.g. Finals Prep - Biology"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="bg-white/5 border-white/10 h-14 rounded-2xl mb-8 text-sm font-bold uppercase italic"
              autoFocus
            />
            <div className="flex gap-4">
              <Button onClick={() => setShowSavePreset(false)} variant="ghost" className="flex-1 rounded-2xl font-bold uppercase">Cancel</Button>
              <Button 
                onClick={savePreset} 
                className="flex-1 bg-primary text-primary-foreground rounded-2xl font-black uppercase py-4 shadow-xl shadow-primary/20"
                disabled={!newPresetName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 w-full overflow-x-hidden">
        <div className="w-full max-w-full mx-auto py-8 px-4 min-w-0">
          <div className="grid grid-cols-1 gap-12 w-full max-w-full min-w-0">
            {filteredNotes.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center mx-auto text-white/10">
                  <BookOpen size={24} />
                </div>
                <p className="text-sm font-black uppercase italic tracking-tighter text-white/20">No matching notebooks found.</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden min-w-0">
                  <div className="flex items-center justify-between px-8 w-full">
                    <div className="flex items-center gap-4">
                      <div 
                        className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white/5")}
                        style={note.color ? { backgroundColor: `${note.color}20`, color: note.color, borderColor: `${note.color}40` } : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                      >
                        <NoteIcon iconName={note.icon} size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">{note.title}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black uppercase italic px-2">{getFolderName(note.folderId)}</Badge>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">{note.quiz?.quiz.length} Questions</span>
                          <button 
                            onClick={() => toggleNote(note.id, note.quiz?.quiz || [])}
                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors italic border-b border-primary/20 pb-0.5"
                          >
                            {note.quiz?.quiz.every((_: any, idx: number) => selectedQuestions.has(`${note.id}:${idx}`)) ? 'DESELECT ALL' : 'SELECT ALL'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => onSelectNote(note.id, 'Quiz')}
                      className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary hover:bg-primary/10 gap-2 italic px-4 h-9 rounded-xl border border-primary/10"
                    >
                      Open in Note <ChevronRight size={14} />
                    </Button>
                  </div>

                  <div className="w-full max-w-full overflow-hidden relative group/scroll">
                    <button 
                      onClick={(e) => {
                        const container = e.currentTarget.parentElement?.querySelector('.scroll-container');
                        if (container) container.scrollLeft -= 500;
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 bg-[#161616]/90 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 opacity-0 group-hover/scroll:opacity-100 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-90"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={(e) => {
                        const container = e.currentTarget.parentElement?.querySelector('.scroll-container');
                        if (container) container.scrollLeft += 500;
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 bg-[#161616]/90 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 opacity-0 group-hover/scroll:opacity-100 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-90"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div 
                      className="scroll-container flex gap-6 pb-8 px-8 overflow-x-auto overflow-y-hidden custom-scrollbar-h scroll-smooth"
                      onWheel={(e) => {
                        if (e.deltaY !== 0) {
                          e.currentTarget.scrollLeft += e.deltaY * 1.5;
                          e.preventDefault();
                        }
                      }}
                    >
                      {note.quiz?.quiz.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="w-[350px] shrink-0">
                          <Card 
                            onClick={() => toggleQuestion(note.id, qIdx)}
                            className={cn(
                              "bg-[#111]/40 border-white/5 hover:border-primary/30 transition-all group rounded-[1.2rem] border-2 shadow-lg backdrop-blur-md overflow-hidden relative h-[180px] cursor-pointer",
                              selectedQuestions.has(`${note.id}:${qIdx}`) 
                                ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]" 
                                : (q.variants && q.variants.length > 0 ? "shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-500/20" : "")
                            )}
                          >
                            <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
                              <div className="flex items-start justify-between">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/60 border border-white/10 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                  {getIconForType(q.type)}
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedQuestions.has(`${note.id}:${qIdx}`) && <CheckCircle size={14} className="text-primary animate-in zoom-in-50 duration-300" />}
                                  <Badge className="text-[8px] font-black uppercase h-4 px-2 bg-white/5 text-white/40 border-0 rounded-md italic">{q.difficulty}</Badge>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-[14px] font-black uppercase italic leading-none tracking-tighter text-white/90 line-clamp-3 mb-2 whitespace-normal group-hover:text-white transition-colors">
                                  {q.type === 'flashcard' ? q.front : (q.question || "Untitled Item")}
                                </h4>
                                <div className="h-px w-full bg-white/5 mb-3" />
                                <div className="flex items-center justify-between text-[8px] font-black uppercase italic tracking-widest text-muted-foreground/60">
                                  <span>{q.type.replace('_', ' ')}</span>
                                  {q.variants && q.variants.length > 0 && (
                                    <span className="text-purple-400 flex items-center gap-1">
                                      <Sparkles size={8} /> {q.variants.length + 1} VARIANTS
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
