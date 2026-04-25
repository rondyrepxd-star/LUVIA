"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Notebook from '@/components/Notebook';
import ChatView from '@/components/ChatView';
import QuizView from '@/components/QuizView';
import AddModal from '@/components/AddModal';
import GlobalSearch from '@/components/GlobalSearch';
import SettingsModal from '@/components/SettingsModal';
import { MasterQuizView } from '@/components/MasterQuizView';
import { GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { processDocument } from '@/ai/flows/process-document-flow';
import { Toaster } from "@/components/ui/toaster"
import { 
  Search, 
  Type, 
  MoreHorizontal, 
  Maximize2, 
  Minimize2,
  Download,
  Loader2,
  Sparkles,
  FileUp,
  Layout,
  Zap,
  X,
  Bell,
  ArrowRight,
  Pencil,
  Trash2,
  BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import NoteIcon from '@/components/NoteIcon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AppTab = 'Notebook' | 'Chat' | 'Quiz' | 'MasterQuiz' | 'MasterQuizSession';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  quiz: GenerateQuizOutput | null;
  chatHistory?: ChatMessage[];
  pastChatSessions?: ChatSession[];
  folderId?: string;
  lastModified: number;
  color?: string;
  icon?: string;
}

export interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface FlashcardNotification {
   id: string;
   prompt: string;
   reveal: string;
   intervalType: 'second' | 'minute' | 'hour' | 'day' | 'week';
   intervalValue: number;
   durationSeconds: number;
   nextTrigger: number;
   isDeactivated?: boolean;
   mutedUntil?: number; // timestamp
   sourceText?: string;
   markerId?: string;
   noteId?: string;
   noteTitle?: string;
   folderPath?: string;
}

export type NotebookWidth = 'standard' | 'wide' | 'full';

const EMPTY_HISTORY: ChatMessage[] = [];
const EMPTY_SESSIONS: ChatSession[] = [];

export default function LuviaApp() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('Notebook');
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 180) newWidth = 180;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  const [appTheme, setAppTheme] = useState('default');
  const [notebookFont, setNotebookFont] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [notebookFontSize, setNotebookFontSize] = useState(18);
  const [notebookWidth, setNotebookWidth] = useState<NotebookWidth>('wide');
  const [isSpellcheckEnabled, setIsSpellcheckEnabled] = useState(true);
  const [masterQuizData, setMasterQuizData] = useState<GenerateQuizOutput | null>(null);
  
  const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const noteScrollPositions = useRef<Record<string, number>>({});

  // State for intelligent import
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Remember Me System (Flashcard Notifications)
  const [flashcards, setFlashcards] = useState<FlashcardNotification[]>([]);
  const [activeFlashcard, setActiveFlashcard] = useState<FlashcardNotification | null>(null);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [isEditingNotification, setIsEditingNotification] = useState(false);
  const [isJumpSourceQuestionDesk, setIsJumpSourceQuestionDesk] = useState(false);
  const [jumpSource, setJumpSource] = useState<'quiz' | 'question-desk' | 'notification' | null>(null);
  const activeFlashcardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isFlashcardManagerOpen, setIsFlashcardManagerOpen] = useState(false);
  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null);
  const [editFlashcardForm, setEditFlashcardForm] = useState<Partial<FlashcardNotification>>({});
  
  // Back to Quiz tracking
  const [isViewingFromQuiz, setIsViewingFromQuiz] = useState(false);

  useEffect(() => {
    const savedCards = localStorage.getItem('luvia_flashcards');
    if (savedCards) setFlashcards(JSON.parse(savedCards));
    
    const handleSchedule = (e: any) => {
      const data = e.detail;
      const getMs = (type: string, val: number) => {
        if (type === 'second') return val * 1000;
        if (type === 'minute') return val * 60 * 1000;
        if (type === 'hour') return val * 60 * 60 * 1000;
        if (type === 'day') return val * 24 * 60 * 60 * 1000;
        if (type === 'week') return val * 7 * 24 * 60 * 60 * 1000;
        return val * 1000;
      };
      
      const newCard: FlashcardNotification = {
        id: Math.random().toString(36).substr(2, 9),
        prompt: data.prompt,
        reveal: data.reveal,
        intervalType: data.intervalType,
        intervalValue: data.intervalValue,
        durationSeconds: data.durationSeconds,
        nextTrigger: Date.now() + getMs(data.intervalType, data.intervalValue),
        sourceText: data.sourceText,
        markerId: data.markerId,
        noteId: data.noteId || activeNoteId || undefined,
        noteTitle: data.noteTitle || (notes.find(n => n.id === (data.noteId || (activeNoteId ?? "")))?.title),
        folderPath: data.folderPath
      };
      
      setFlashcards(prev => [...prev, newCard]);
    };
    
    const handleOpenReminderManager = (e: any) => {
      const markerId = e.detail;
      // Use functional state to avoid dependency on flashcards
      setFlashcards(currentFlashcards => {
        const card = currentFlashcards.find(c => c.markerId === markerId);
        if (card) {
          setEditingFlashcardId(card.id);
          setEditFlashcardForm({ 
            prompt: card.prompt, 
            reveal: card.reveal, 
            intervalType: card.intervalType, 
            intervalValue: card.intervalValue, 
            durationSeconds: card.durationSeconds 
          });
          setIsFlashcardManagerOpen(true);
        }
        return currentFlashcards;
      });
    };

    window.addEventListener('luvia-schedule-flashcard', handleSchedule);
    window.addEventListener('luvia-open-reminder-manager', handleOpenReminderManager);
    return () => {
      window.removeEventListener('luvia-schedule-flashcard', handleSchedule);
      window.removeEventListener('luvia-open-reminder-manager', handleOpenReminderManager);
    };
  }, [activeNoteId]); // Minimal dependencies for event listeners

  useEffect(() => {
    if (isInitialLoadDone) {
      try {
        localStorage.setItem('luvia_flashcards', JSON.stringify(flashcards));
      } catch (e) {
        console.error('Failed to save flashcards to localStorage', e);
      }
    }
  }, [flashcards, isInitialLoadDone]);

  useEffect(() => {
    if (activeFlashcard && !isEditingNotification) {
      if (activeFlashcardTimerRef.current) clearTimeout(activeFlashcardTimerRef.current);
      activeFlashcardTimerRef.current = setTimeout(() => {
        if (!isEditingNotification) {
          setActiveFlashcard(null);
        }
      }, activeFlashcard.durationSeconds * 1000);
    } else if (isEditingNotification) {
      if (activeFlashcardTimerRef.current) clearTimeout(activeFlashcardTimerRef.current);
    }
    return () => { if (activeFlashcardTimerRef.current) clearTimeout(activeFlashcardTimerRef.current); };
  }, [activeFlashcard, isEditingNotification]);

  useEffect(() => {
    // Check flashcards every 10 seconds
    const interval = setInterval(() => {
      if (activeFlashcard || isEditingNotification) return; 
      
      const now = Date.now();
      const dueCard = flashcards.find(c => 
        !c.isDeactivated && 
        (!c.mutedUntil || c.mutedUntil <= now) && 
        c.nextTrigger <= now
      );
      
      if (dueCard) {
        // Show it
        setActiveFlashcard(dueCard);
        setFlashcardRevealed(false);
        
        // Schedule next occurrence based on interval
        const getMs = (type: string, val: number) => {
          if (type === 'second') return val * 1000;
          if (type === 'minute') return val * 60 * 1000;
          if (type === 'hour') return val * 60 * 60 * 1000;
          if (type === 'day') return val * 24 * 60 * 60 * 1000;
          if (type === 'week') return val * 7 * 24 * 60 * 60 * 1000;
          return val * 1000;
        };
        
        setFlashcards(prev => prev.map(c => 
          c.id === dueCard.id ? { ...c, nextTrigger: now + getMs(c.intervalType, c.intervalValue) } : c
        ));
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [flashcards, activeFlashcard, isEditingNotification]);

  useEffect(() => {
    const savedNotes = localStorage.getItem('luvia_notes');
    const savedFolders = localStorage.getItem('luvia_folders');
    const lastActiveId = localStorage.getItem('luvia_active_id');
    const savedFont = localStorage.getItem('luvia_font');
    const savedFontSize = localStorage.getItem('luvia_font_size');
    const savedWidth = localStorage.getItem('luvia_width');
    const savedSidebar = localStorage.getItem('luvia_sidebar_collapsed');
    const savedSpellcheck = localStorage.getItem('luvia_spellcheck');
    const savedTheme = localStorage.getItem('luvia_theme');

    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
    if (lastActiveId) setActiveNoteId(lastActiveId);
    if (savedFont) setNotebookFont(savedFont as any);
    if (savedFontSize) setNotebookFontSize(parseInt(savedFontSize, 10));
    if (savedWidth) setNotebookWidth(savedWidth as NotebookWidth);
    if (savedSidebar) setIsSidebarCollapsed(savedSidebar === 'true');
    if (savedSpellcheck) setIsSpellcheckEnabled(savedSpellcheck === 'true');
    if (savedTheme) setAppTheme(savedTheme);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    setIsInitialLoadDone(true);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isInitialLoadDone) return;
    
    try {
      localStorage.setItem('luvia_notes', JSON.stringify(notes));
      localStorage.setItem('luvia_folders', JSON.stringify(folders));
      localStorage.setItem('luvia_font', notebookFont);
      localStorage.setItem('luvia_font_size', notebookFontSize.toString());
      localStorage.setItem('luvia_width', notebookWidth);
      localStorage.setItem('luvia_sidebar_collapsed', String(isSidebarCollapsed));
      localStorage.setItem('luvia_spellcheck', String(isSpellcheckEnabled));
      localStorage.setItem('luvia_theme', appTheme);
      if (activeNoteId) localStorage.setItem('luvia_active_id', activeNoteId);
    } catch (e) {
      console.warn("localStorage quota exceeded. Consider exporting your data and deleting older notes.", e);
    }
  }, [notes, folders, activeNoteId, notebookFont, notebookFontSize, notebookWidth, isSidebarCollapsed, isSpellcheckEnabled, appTheme, isInitialLoadDone]);

  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId) || null
  , [notes, activeNoteId]);

  const updateActiveNote = useCallback((updates: Partial<StudyNote>) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => 
      n.id === activeNoteId ? { ...n, ...updates, lastModified: Date.now() } : n
    ));
  }, [activeNoteId]);

  const handleChatHistoryChange = useCallback((newHistory: ChatMessage[]) => {
    updateActiveNote({ chatHistory: newHistory });
  }, [updateActiveNote]);

  const handlePastSessionsChange = useCallback((newSessions: ChatSession[]) => {
    updateActiveNote({ pastChatSessions: newSessions });
  }, [updateActiveNote]);

  const handleCreateNote = (folderId?: string, initialTitle?: string, initialContent?: string, quizData?: GenerateQuizOutput | null) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newNote: StudyNote = {
      id: newId,
      title: initialTitle || 'New Note',
      content: initialContent || '',
      tags: initialContent ? ['ai-organized'] : [],
      quiz: quizData || null,
      chatHistory: [],
      pastChatSessions: [],
      folderId,
      lastModified: Date.now()
    };
    setNotes(prev => [...prev, newNote]);
    setActiveNoteId(newId);
    setActiveTab('Notebook');
    return newId;
  };

  const handleImportFile = async (file: File) => {
    if (file.name.toLowerCase().endsWith('.luvia')) {
      try {
        const text = await file.text();
        const luviaData = JSON.parse(text);
        
        // CASE A: Full Folder/Collection Export
        if (luviaData.type === 'luvia_folder_export' && luviaData.data) {
          const importNode = (node: any, parentId?: string) => {
            const newFolderId = Math.random().toString(36).substr(2, 9);
            const newFolder: Folder = {
              ...node.folder,
              id: newFolderId,
              parentId
            };
            
            setFolders(prev => [...prev, newFolder]);
            
            // Add notes in this folder
            if (node.notes && Array.isArray(node.notes)) {
              node.notes.forEach((note: StudyNote) => {
                const newNoteId = Math.random().toString(36).substr(2, 9);
                const restoredNote: StudyNote = {
                  ...note,
                  id: newNoteId,
                  folderId: newFolderId,
                  lastModified: Date.now()
                };
                setNotes(prev => [...prev, restoredNote]);
              });
            }
            
            // Recursively add subfolders
            if (node.subfolders && Array.isArray(node.subfolders)) {
              node.subfolders.forEach((sub: any) => importNode(sub, newFolderId));
            }
          };
          
          importNode(luviaData.data);
          toast({ title: "Collection Restored", description: `"${luviaData.data.folder.name}" and all its content imported successfully.` });
          return;
        }

        // CASE B: Single Note Export
        if (luviaData && (luviaData.id !== undefined || luviaData.title !== undefined)) {
          const newId = Math.random().toString(36).substr(2, 9);
          const restoredNote: StudyNote = {
            ...luviaData,
            id: newId,
            lastModified: Date.now(),
            folderId: undefined 
          };
          setNotes(prev => [...prev, restoredNote]);
          setActiveNoteId(newId);
          setActiveTab('Notebook');
          toast({ title: "Note Restored", description: `"${restoredNote.title}" imported successfully.` });
        } else {
          throw new Error('Invalid format');
        }
      } catch (e) {
        console.error("Import error:", e);
        toast({ variant: "destructive", title: "Load Failed", description: "The .luvia file is corrupted or invalid." });
      }
      return;
    }

    setIsProcessingDoc(true);
    setProcessingStatus('Reading document structure...');
    
    try {
      let rawText = '';
      
      if (file.name.toLowerCase().endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        rawText = result.value;
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        toast({ title: "PDF Not Supported Yet", description: "Currently only .docx and .txt are supported." });
        setIsProcessingDoc(false);
        return;
      } else {
        rawText = await file.text();
      }

      if (!rawText.trim()) throw new Error('Document is empty.');

      setProcessingStatus('AI Architecting content...');
      const organizedNote = await processDocument({ rawText });
      
      handleCreateNote(undefined, organizedNote.title, organizedNote.formattedHtml, null);
      
      toast({
        title: "Import Success",
        description: `Organized by AI.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "An error occurred while processing the document.",
      });
    } finally {
      setIsProcessingDoc(false);
      setProcessingStatus('');
    }
  };

  const handleCreateFolder = (parentId?: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newFolder: Folder = {
      id: newId,
      name: parentId ? 'New Sub-collection' : 'New Collection',
      isOpen: true,
      color: 'hsl(var(--primary))',
      icon: 'Folder',
      parentId
    };
    setFolders(prev => [...prev, newFolder]);
    return newId;
  };

  const handleExportLuvia = () => {
    if (!activeNote) return;
    try {
      const dataStr = JSON.stringify(activeNote, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Luvia - ${activeNote.title || 'Note'}.luvia`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Backup Complete", description: "All notebook data, history, and quizzes saved to .luvia." });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export luvia file." });
    }
  };

  const handleExportDocx = async () => {
    if (!activeNote) return;

    try {
      const { Document, Packer, Paragraph, HeadingLevel } = await import('docx');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = activeNote.content;

      const children = Array.from(tempDiv.childNodes);
      const paragraphs: any[] = [];

      paragraphs.push(new Paragraph({
        text: activeNote.title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }));

      children.forEach((node: any) => {
        if (node.nodeType === 1) { // ELEMENT_NODE
          const text = node.textContent?.trim() || '';
          if (!text) return;
          let heading;
          switch (node.tagName) {
            case 'H1': heading = HeadingLevel.HEADING_1; break;
            case 'H2': heading = HeadingLevel.HEADING_2; break;
            case 'H3': heading = HeadingLevel.HEADING_3; break;
            default: heading = undefined;
          }
          paragraphs.push(new Paragraph({
            text: text,
            heading: heading,
            spacing: { before: 200, after: 200 },
          }));
        }
      });

      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeNote.title || 'Note'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Export Success", description: "Note exported to .docx successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "An error occurred." });
    }
  };

  const handleStartMasterQuiz = (selectedIds: string[]) => {
    // Save current scroll before switching
    if (activeNoteId && activeTab === 'Notebook') {
      const scrollArea = document.querySelector('.notebook-scroll-area');
      if (scrollArea) noteScrollPositions.current[`${activeNoteId}-Notebook`] = scrollArea.scrollTop;
    }
    
    const allQuestions: any[] = [];
    selectedIds.forEach(id => {
      const [noteId, qIdxStr] = id.split(':');
      const qIdx = parseInt(qIdxStr);
      const note = notes.find(n => n.id === noteId);
      if (note && note.quiz?.quiz && note.quiz.quiz[qIdx]) {
        allQuestions.push(note.quiz.quiz[qIdx]);
      }
    });
    setMasterQuizData({ quiz: allQuestions });
    setActiveTab('MasterQuizSession');
  };

  const handleTabChange = (tab: AppTab) => {
    // Save current scroll before switching
    if (activeNoteId && activeTab === 'Notebook') {
      const scrollArea = document.querySelector('.notebook-scroll-area');
      if (scrollArea) noteScrollPositions.current[`${activeNoteId}-Notebook`] = scrollArea.scrollTop;
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeTab === 'Notebook' && activeNoteId) {
      const key = `${activeNoteId}-Notebook`;
      setTimeout(() => {
        const scrollArea = document.querySelector('.notebook-scroll-area');
        if (scrollArea && noteScrollPositions.current[key]) {
          scrollArea.scrollTop = noteScrollPositions.current[key];
        }
      }, 100);
    }
  }, [activeTab, activeNoteId]);

  const renderContent = () => {
    if (!activeNote && activeTab !== 'MasterQuiz' && activeTab !== 'MasterQuizSession') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z"/></svg>
          </div>
          <h2 className="text-2xl font-bold">Select or Create a Note</h2>
          <p className="text-muted-foreground max-w-sm">
            Choose a study unit from your library or import a document to start your AI-powered session.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => handleCreateNote()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl font-bold transition-all active:scale-95"
            >
              Create Blank Note
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl font-bold transition-all active:scale-95 border border-white/5"
            >
              Import Document
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {activeNote && (
          <>
            <div className={cn("h-full w-full", activeTab !== 'Notebook' && "hidden")}>
              <Notebook 
                key={activeNote.id}
                title={activeNote.title} 
                setTitle={(val) => updateActiveNote({ title: val })} 
                content={activeNote.content} 
                setContent={(val) => updateActiveNote({ content: val })}
                tags={activeNote.tags}
                setTags={(val) => {
                  const currentTags = activeNote.tags;
                  const newTags = typeof val === 'function' ? val(currentTags) : val;
                  updateActiveNote({ tags: newTags });
                }}
                fontFamily={notebookFont}
                fontSize={notebookFontSize}
                width={notebookWidth}
                spellcheckEnabled={isSpellcheckEnabled}
              />
            </div>
            <div className={cn("h-full w-full", activeTab !== 'Chat' && "hidden")}>
              <ChatView 
                noteContent={activeNote.content} 
                history={activeNote.chatHistory || EMPTY_HISTORY}
                setHistory={handleChatHistoryChange}
                pastSessions={activeNote.pastChatSessions || EMPTY_SESSIONS}
                setPastSessions={handlePastSessionsChange}
              />
            </div>
            <div className={cn("h-full w-full", activeTab !== 'Quiz' && "hidden")}>
              <QuizView 
                currentNoteId={activeNote.id}
                noteContent={activeNote.content} 
                quiz={activeNote.quiz || null} 
                setQuiz={(val) => updateActiveNote({ quiz: val || undefined })} 
                onNavigateToNotebook={(text, source) => {
                  setIsViewingFromQuiz(text !== 'selection_mode_start');
                  if (source) setJumpSource(source as any);
                  else if (text !== 'selection_mode_start') setJumpSource('quiz');
                  
                  setActiveTab('Notebook');
                  if (text && text !== 'selection_mode_start') {
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('luvia-smart-link', { detail: text }));
                    }, 400);
                  }
                }}
              />
            </div>
          </>
        )}
        
        {activeTab === 'MasterQuiz' && (
          <MasterQuizView 
            notes={notes}
            folders={folders}
            onSelectNote={(id) => {
              setActiveNoteId(id);
              setActiveTab('Quiz');
            }}
            onStartMasterQuiz={handleStartMasterQuiz}
          />
        )}
        
        {activeTab === 'MasterQuizSession' && (
          <QuizView 
            currentNoteId="master-quiz"
            noteContent="" 
            quiz={masterQuizData} 
            setQuiz={(val) => setMasterQuizData(val)} 
            onExit={() => setActiveTab('MasterQuiz')}
            autoStart={true}
          />
        )}
      </>
    );
  };

  const tabs: AppTab[] = ['Notebook', 'Chat', 'Quiz'];

  const handleTabScroll = (index: number) => {
    const editor = document.querySelector('.editor-content');
    if (editor) {
      const headings = Array.from(editor.querySelectorAll('h1, h2'));
      const target = headings[index] as HTMLElement;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex h-screen bg-[#0d0d0f] text-foreground overflow-hidden font-body transition-colors duration-500",
        appTheme === 'aurora' ? 'theme-aurora' : '',
        appTheme === 'crimson' ? 'theme-crimson' : '',
        appTheme === 'emerald' ? 'theme-emerald' : '',
        appTheme === 'light' ? 'theme-light' : ''
      )} suppressHydrationWarning>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
          }} 
          className="hidden" 
          accept=".docx,.pdf,.txt,.luvia"
        />
        
        {/* Intelligent Loading Screen */}
        {isProcessingDoc && (
          <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse rounded-full" />
              <div className="relative w-24 h-24 bg-primary/10 rounded-[2.5rem] border-2 border-primary/20 flex items-center justify-center shadow-2xl">
                <Sparkles size={48} className="text-primary animate-bounce" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background border-2 border-primary/20 p-2 rounded-xl shadow-xl">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Luvia is Thinking...</h2>
            <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em] italic mb-12 animate-pulse">{processingStatus}</p>
            <div className="w-full max-w-md h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-[40%]" />
            </div>
          </div>
        )}

        <div 
          className={cn(
            "transition-all duration-300 overflow-hidden shrink-0 z-40 bg-[#0d0d0f] md:bg-transparent absolute inset-y-0 left-0 md:relative group/sidebar", 
            isSidebarCollapsed ? "-translate-x-full md:translate-x-0 md:w-12" : "translate-x-0"
          )}
          style={{ width: isSidebarCollapsed ? undefined : `${sidebarWidth}px` }}
        >
          <Sidebar 
            notes={notes}
            folders={folders}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
            onCreateFolder={handleCreateFolder}
            setFolders={setFolders}
            setNotes={setNotes}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          
          {/* Resize handle */}
          {!isSidebarCollapsed && (
            <div 
              onMouseDown={startResizing}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-50 group-hover/sidebar:bg-white/5"
            />
          )}
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          {!isFocusMode && (
            <div className="z-30 bg-[#0d0d0f]/50 backdrop-blur-xl border-b border-white/5 shrink-0 flex-none keep-dark">
              <div className="flex items-center justify-between px-3 md:px-8 h-16 gap-2">
                {activeNote && (
                    <div className="bg-[#141416] p-1 rounded-2xl inline-flex items-center gap-1 shadow-xl border border-white/5 shrink-0">
                      {tabs.map(tab => (
                        <button
                          key={tab}
                          id={tab === 'Quiz' ? 'quiz-tab-button' : undefined}
                          onClick={() => handleTabChange(tab)}
                          className={cn(
                            "px-3 py-1.5 text-[12px] font-semibold transition-all rounded-xl",
                            activeTab === tab ? "bg-[#232326] text-white shadow-sm" : "text-muted-foreground hover:text-white hover:bg-white/5"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                )}
                {activeNote && (
                  <div className="flex-1 flex justify-center items-center px-2 md:px-6 overflow-hidden gap-2 md:gap-3">
                    <div 
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-lg border border-white/5 transition-all duration-500")}
                      style={activeNote.color ? { backgroundColor: `${activeNote.color}20`, color: activeNote.color } : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                    >
                      <NoteIcon iconName={activeNote.icon} size={14} />
                    </div>
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => updateActiveNote({ title: e.target.value })}
                      className="bg-transparent border-none outline-none text-[13px] font-bold text-white keep-white w-full max-w-[150px] md:max-w-[400px] truncate focus:ring-0 placeholder:text-white/20"
                      placeholder="Note Title"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Bell / Recordatorio Button */}
                  <button
                    onClick={() => setIsFlashcardManagerOpen(true)}
                    className="relative h-8 w-8 rounded-lg flex items-center justify-center text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all mr-1"
                    title="Recordatorios"
                  >
                    <Bell size={16} />
                    {flashcards.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-400 rounded-full text-[8px] font-black text-yellow-950 flex items-center justify-center">{flashcards.length}</span>
                    )}
                  </button>
                  <Button 
                    onClick={() => setIsFocusMode(true)}
                    size="sm" 
                    className="bg-primary/20 hover:bg-primary/30 text-primary rounded-lg gap-2 h-8 px-3 text-xs font-semibold shadow-sm mr-2 border border-primary/20"
                  >
                    <Maximize2 size={14} /> Focus Mode
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-white/5" onClick={() => setIsSearchOpen(true)}>
                    <Search size={16} />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-white/5"><Type size={16} /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-[#161616] border-white/10 shadow-2xl rounded-xl">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 p-2 italic">Typography</p>
                        <button onClick={() => setNotebookFont('sans')} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all", notebookFont === 'sans' ? "bg-primary/20 text-primary" : "text-white/60 hover:bg-white/5 hover:text-white")}>Sans-serif</button>
                        <button onClick={() => setNotebookFont('serif')} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all", notebookFont === 'serif' ? "bg-primary/20 text-primary" : "text-white/60 hover:bg-white/5 hover:text-white")}>Serif Mode</button>
                        <button onClick={() => setNotebookFont('mono')} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all", notebookFont === 'mono' ? "bg-primary/20 text-primary" : "text-white/60 hover:bg-white/5 hover:text-white")}>Monospace</button>
                        
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 p-2 mt-2 border-t border-white/5 italic">Page Width</p>
                        <div className="flex p-1 bg-black/20 rounded-lg gap-1">
                          {(['standard', 'wide', 'full'] as NotebookWidth[]).map((w) => (
                            <button
                              key={w}
                              onClick={() => setNotebookWidth(w)}
                              className={cn(
                                "flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all",
                                notebookWidth === w ? "bg-primary text-primary-foreground" : "text-white/40 hover:text-white"
                              )}
                            >
                              {w}
                            </button>
                          ))}
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 p-2 mt-2 border-t border-white/5 italic">Font Size</p>
                        <div className="px-2 pb-1">
                          <Slider value={[notebookFontSize]} onValueChange={(val) => setNotebookFontSize(val[0])} min={12} max={36} step={1} className="py-2" />
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 p-2 mt-2 border-t border-white/5 italic">Escritura</p>
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                          <span className="text-[11px] font-bold uppercase tracking-tight text-white/60 italic">Corrección</span>
                          <Switch checked={isSpellcheckEnabled} onCheckedChange={setIsSpellcheckEnabled} />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-white/5"><MoreHorizontal size={16} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#161616] border-white/10 shadow-2xl rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 p-2 italic">Note Actions</p>
                      <DropdownMenuItem onClick={handleExportLuvia} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white cursor-pointer">
                        <Download size={14} className="text-primary" /> Download Backup (.luvia)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white cursor-pointer">
                        <FileUp size={14} className="text-primary" /> Import Backup (.luvia)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem onClick={handleExportDocx} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white cursor-pointer opacity-50">
                        <Download size={14} /> Export to Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white cursor-pointer opacity-50">
                        <FileUp size={14} /> Import Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-destructive/60 hover:bg-destructive/10 hover:text-destructive cursor-pointer">Archive Note</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}



          {isFocusMode && (
            <Button onClick={() => setIsFocusMode(false)} variant="ghost" size="icon" className="fixed top-6 right-8 z-[100] h-10 w-10 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-muted-foreground hover:text-white transition-all shadow-2xl">
              <Minimize2 size={20} />
            </Button>
          )}

          <main className={cn("flex-1 overflow-hidden relative", isFocusMode && "bg-background")}>
            <div className="h-full relative">{renderContent()}</div>
          </main>
        </div>

        <AddModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onNoteCreate={() => handleCreateNote()}
          onFileUpload={handleImportFile}
        />

        <GlobalSearch 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
          notes={notes}
          onSelectNote={(id) => {
            setActiveNoteId(id);
            setIsSearchOpen(false);
            setActiveTab('Notebook');
          }}
        />
        
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          fontSize={notebookFontSize}
          setFontSize={setNotebookFontSize}
          fontFamily={notebookFont}
          setFontFamily={setNotebookFont}
          theme={appTheme}
          setTheme={setAppTheme}
        />
        
        {/* Flashcard Notification Overlay - bigger card with actions */}
        {activeFlashcard && (
          <div className="fixed top-6 right-6 z-[200] w-[380px] bg-[#111] border border-yellow-400/30 rounded-3xl p-6 shadow-[0_30px_80px_rgba(250,204,21,0.25)] animate-in slide-in-from-right fade-in duration-500 keep-dark">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center border border-yellow-400/20 animate-pulse">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400/70 italic">Recordatorio Luvia</p>
                  {activeFlashcard.noteTitle && (
                    <p className="text-[9px] text-white/30 font-bold truncate max-w-[200px]">{activeFlashcard.folderPath ? `${activeFlashcard.folderPath} / ` : ''}{activeFlashcard.noteTitle}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveFlashcard(null);
                  if (activeFlashcardTimerRef.current) clearTimeout(activeFlashcardTimerRef.current);
                }}
                className="text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content or Edit Form */}
            {isEditingNotification ? (
              <div className="space-y-4 py-2 animate-in zoom-in-95 fade-in duration-300">
                <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400/60 mb-1 italic">EDITAR RECORDATORIO</p>
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[10px] font-bold text-white/50">Texto de Notificación</label>
                  <textarea 
                    value={editFlashcardForm.prompt || ''}
                    onChange={(e) => setEditFlashcardForm(prev => ({ ...prev, prompt: e.target.value }))}
                    className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white/90 focus:border-yellow-400/50 outline-none resize-none h-16 transition-all font-medium"
                    placeholder="Ej: ¿Cómo se dice hola en inglés?"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/50">Texto de Revelación</label>
                  <textarea 
                    value={editFlashcardForm.reveal || ''}
                    onChange={(e) => setEditFlashcardForm(prev => ({ ...prev, reveal: e.target.value }))}
                    className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-primary focus:border-yellow-400/50 outline-none resize-none h-16 transition-all font-medium italic"
                    placeholder="Ej: Hola en inglés es Hi"
                  />
                </div>

                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-bold text-white/50">Programación</label>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="flex flex-col gap-1.5">
                       <div className="flex bg-black/50 border border-white/10 rounded-xl overflow-hidden">
                         <input 
                           type="number"
                           value={editFlashcardForm.intervalValue || 1}
                           onChange={(e) => setEditFlashcardForm(prev => ({ ...prev, intervalValue: Number(e.target.value) || 1 }))}
                           className="bg-transparent text-xs text-center w-full outline-none p-2 border-r border-white/10 text-foreground font-bold"
                         />
                         <select 
                           value={editFlashcardForm.intervalType || 'minute'}
                           onChange={(e) => setEditFlashcardForm(prev => ({ ...prev, intervalType: e.target.value as any }))}
                           className="bg-[#111] text-[10px] p-2 outline-none appearance-none text-center text-white/70 font-bold"
                         >
                           <option value="second">Seg</option>
                           <option value="minute">Min</option>
                           <option value="hour">Hora</option>
                           <option value="day">Día</option>
                           <option value="week">Sem</option>
                         </select>
                       </div>
                       <span className="text-[8px] text-white/20 font-bold uppercase text-center">Cada X tiempo</span>
                     </div>
                     
                     <div className="flex flex-col gap-1.5">
                       <div className="flex items-center bg-black/50 border border-white/10 rounded-xl px-2">
                         <input 
                           type="number"
                           value={editFlashcardForm.durationSeconds || 10}
                           onChange={(e) => setEditFlashcardForm(prev => ({ ...prev, durationSeconds: Number(e.target.value) || 10 }))}
                           className="bg-transparent text-xs w-full text-center outline-none py-2 text-foreground font-bold"
                         />
                         <span className="text-[10px] text-white/30 font-bold ml-1">seg</span>
                       </div>
                       <span className="text-[8px] text-white/20 font-bold uppercase text-center">Visible por</span>
                     </div>
                   </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => {
                      if (activeFlashcard) {
                        setFlashcards(prev => prev.map(c => c.id === activeFlashcard.id ? { ...c, ...editFlashcardForm } : c));
                        setActiveFlashcard({ ...activeFlashcard, ...editFlashcardForm } as FlashcardNotification);
                        setIsEditingNotification(false);
                        setEditFlashcardForm({});
                        toast({ title: "Guardado", description: "El recordatorio ha sido actualizado." });
                      }
                    }}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-[10px] uppercase py-3 rounded-xl shadow-lg transition-all"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingNotification(false);
                      setEditFlashcardForm({});
                    }}
                    className="px-5 bg-white/5 hover:bg-white/10 text-white/40 font-black text-[10px] uppercase py-3 rounded-xl transition-all border border-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Prompt */}
                <p className="text-base font-semibold text-white keep-white leading-relaxed mb-4">{activeFlashcard.prompt}</p>
                
                {/* Source text snippet if available */}
                {activeFlashcard.sourceText && (
                  <div className="bg-yellow-400/5 border border-yellow-400/10 rounded-xl px-3 py-2 mb-4">
                    <p className="text-[9px] font-black uppercase text-yellow-400/40 tracking-widest mb-1">Texto de referencia</p>
                    <p className="text-xs text-white/50 italic truncate font-medium">&ldquo;{activeFlashcard.sourceText}&rdquo;</p>
                  </div>
                )}

                {/* Reveal */}
                {!flashcardRevealed ? (
                  <button 
                    onClick={() => setFlashcardRevealed(true)}
                    className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 font-black text-xs py-3 rounded-2xl transition-all border border-yellow-400/20 mb-5 uppercase tracking-widest"
                  >
                    Clic para revelar la respuesta
                  </button>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-300 mb-5 relative overflow-hidden group/reveal">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400/50" />
                    <p className="text-sm text-white keep-white italic font-bold leading-relaxed">{activeFlashcard.reveal}</p>
                  </div>
                )}

                {/* Action buttons Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="col-span-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center justify-center h-10 w-full rounded-xl bg-white/5 border border-white/5 text-yellow-400/40 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all" title="Opciones de silencio">
                          <BellOff size={16} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-2 bg-[#121214] border-white/10 shadow-2xl rounded-2xl z-[210]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 p-2 italic mb-1 border-b border-white/5">Opciones de Mute</p>
                        <button 
                          onClick={() => {
                            const until = Date.now() + 60 * 60 * 1000;
                            setFlashcards(prev => prev.map(c => c.id === activeFlashcard.id ? { ...c, mutedUntil: until } : c));
                            setActiveFlashcard(null);
                            toast({ title: "Muteado por 1 hora", description: "Volverá a aparecer después." });
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] font-bold text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-all"
                        >
                          Silenciar por 1 hora
                        </button>
                        <button 
                          onClick={() => {
                            const until = Date.now() + 24 * 60 * 60 * 1000;
                            setFlashcards(prev => prev.map(c => c.id === activeFlashcard.id ? { ...c, mutedUntil: until } : c));
                            setActiveFlashcard(null);
                            toast({ title: "Muteado por hoy", description: "Volverá a aparecer mañana." });
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] font-bold text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-all"
                        >
                          Silenciar por todo el día
                        </button>
                        <button 
                          onClick={() => {
                            setFlashcards(prev => prev.map(c => c.id === activeFlashcard.id ? { ...c, isDeactivated: true } : c));
                            setActiveFlashcard(null);
                            toast({ title: "Desactivado", description: "No se volverá a mostrar hasta que lo reactives." });
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] font-bold text-destructive/70 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
                        >
                          Desactivar permanente
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="col-span-3">
                    <button
                      onClick={() => {
                        if (activeFlashcard.noteId) {
                          // Asegurarse de que el ID existe en nuestras notas
                          const noteExists = notes.find(n => n.id === activeFlashcard.noteId);
                          if (!noteExists) {
                            toast({ title: "Nota no encontrada", description: "La nota original parece haber sido eliminada." });
                            return;
                          }
                          setActiveNoteId(activeFlashcard.noteId);
                          setActiveTab('Notebook');
                          setJumpSource('notification');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('luvia-smart-link', { detail: activeFlashcard.markerId || activeFlashcard.sourceText }));
                          }, 500);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-black text-[10px] h-10 rounded-xl transition-all border border-white/5 uppercase tracking-widest italic"
                    >
                      <ArrowRight size={14} /> Ir al texto
                    </button>
                  </div>

                  <div className="col-span-3">
                    <button
                      onClick={() => {
                        setIsEditingNotification(true);
                        setEditFlashcardForm({ 
                          prompt: activeFlashcard.prompt, 
                          reveal: activeFlashcard.reveal, 
                          intervalType: activeFlashcard.intervalType, 
                          intervalValue: activeFlashcard.intervalValue, 
                          durationSeconds: activeFlashcard.durationSeconds 
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-black text-[10px] h-10 rounded-xl transition-all border border-white/5 uppercase tracking-widest italic"
                    >
                      <Pencil size={14} /> Editar
                    </button>
                  </div>

                  <div className="col-span-1">
                    <button
                      onClick={() => {
                        setFlashcards(prev => {
                          const cardToDelete = prev.find(c => c.id === activeFlashcard.id);
                          if (cardToDelete?.markerId) {
                             window.dispatchEvent(new CustomEvent('luvia-remove-reminder', { detail: cardToDelete.markerId }));
                          }
                          return prev.filter(c => c.id !== activeFlashcard.id);
                        });
                        setActiveFlashcard(null);
                        if (activeFlashcardTimerRef.current) clearTimeout(activeFlashcardTimerRef.current);
                      }}
                      className="w-full flex items-center justify-center h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500/60 hover:text-red-500 border border-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Duration progress bar (only show if not editing) */}
            {!isEditingNotification && (
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400/60 shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                  style={{ animation: `shrink ${activeFlashcard.durationSeconds}s linear forwards` }} 
                />
              </div>
            )}
          </div>
        )}

        {/* Flashcard Manager Panel */}
        {isFlashcardManagerOpen && (
          <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end justify-end p-6 animate-in fade-in duration-200" onClick={() => { setIsFlashcardManagerOpen(false); setEditingFlashcardId(null); }}>
            <div className="w-[420px] max-h-[75vh] bg-[#111] border border-yellow-400/20 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] flex flex-col animate-in slide-in-from-right zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400/15 text-yellow-400 flex items-center justify-center border border-yellow-400/20">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase italic tracking-tighter text-white">Recordatorios</p>
                    <p className="text-[10px] text-white/30 font-bold">{flashcards.length} programados</p>
                  </div>
                </div>
                <button onClick={() => { setIsFlashcardManagerOpen(false); setEditingFlashcardId(null); }} className="text-white/30 hover:text-white bg-white/5 rounded-xl p-2 transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {flashcards.length === 0 && (
                  <div className="text-center py-12">
                    <Bell size={32} className="text-white/10 mx-auto mb-3" />
                    <p className="text-xs text-white/30 font-bold uppercase italic">Sin recordatorios aún</p>
                    <p className="text-[10px] text-white/20 mt-1">Selecciona texto en el editor y usa el botón 🔔</p>
                  </div>
                )}
                {flashcards.map(card => (
                  <div key={card.id} className={cn("rounded-2xl border p-4 transition-all", editingFlashcardId === card.id ? "border-yellow-400/40 bg-yellow-400/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]")}>
                    {editingFlashcardId === card.id ? (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-white/50">Texto de Notificación</label>
                          <textarea 
                            value={editFlashcardForm.prompt}
                            onChange={(e) => setEditFlashcardForm({...editFlashcardForm, prompt: e.target.value})}
                            className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-foreground focus:border-yellow-400/50 outline-none resize-none h-16 transition-all"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-white/50">Texto de Revelación</label>
                          <textarea 
                            value={editFlashcardForm.reveal}
                            onChange={(e) => setEditFlashcardForm({...editFlashcardForm, reveal: e.target.value})}
                            className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-foreground focus:border-yellow-400/50 outline-none resize-none h-16 transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-white/50">Programación</label>
                           <div className="grid grid-cols-2 gap-3">
                             <div className="flex flex-col gap-1.5">
                               <div className="flex bg-black/50 border border-white/10 rounded-xl overflow-hidden">
                                 <input 
                                   type="number"
                                   value={editFlashcardForm.intervalValue}
                                   onChange={(e) => setEditFlashcardForm({...editFlashcardForm, intervalValue: Number(e.target.value) || 1})}
                                   className="bg-transparent text-xs text-center w-full outline-none p-2 border-r border-white/10 text-foreground"
                                 />
                                 <select 
                                   value={editFlashcardForm.intervalType}
                                   onChange={(e) => setEditFlashcardForm({...editFlashcardForm, intervalType: e.target.value as "second" | "minute" | "hour" | "day" | "week"})}
                                   className="bg-transparent text-[10px] p-2 outline-none appearance-none text-center text-white/70 font-bold"
                                 >
                                   <option className="bg-[#111]" value="second">Seg</option>
                                   <option className="bg-[#111]" value="minute">Min</option>
                                   <option className="bg-[#111]" value="hour">Hora</option>
                                   <option className="bg-[#111]" value="day">Día</option>
                                   <option className="bg-[#111]" value="week">Sem</option>
                                 </select>
                               </div>
                               <span className="text-[8px] text-white/20 font-bold uppercase text-center">Cada X tiempo</span>
                             </div>
                             
                             <div className="flex flex-col gap-1.5">
                               <div className="flex items-center bg-black/50 border border-white/10 rounded-xl px-2">
                                 <input 
                                   type="number"
                                   value={editFlashcardForm.durationSeconds}
                                   onChange={(e) => setEditFlashcardForm({...editFlashcardForm, durationSeconds: Number(e.target.value) || 10})}
                                   className="bg-transparent text-xs w-full text-center outline-none py-2 text-foreground"
                                 />
                                 <span className="text-[10px] text-white/30 font-bold ml-1">seg</span>
                               </div>
                               <span className="text-[8px] text-white/20 font-bold uppercase text-center">Visible por</span>
                             </div>
                           </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button onClick={() => {
                            setFlashcards(prev => prev.map(c => c.id === card.id ? { ...c, ...editFlashcardForm } : c));
                            setEditingFlashcardId(null);
                          }} className="flex-1 bg-yellow-400 text-yellow-950 font-black text-[10px] uppercase py-3 rounded-xl shadow-[0_10px_30px_-10px_rgba(250,204,21,0.5)]">Guardar Cambios</button>
                          <button onClick={() => setEditingFlashcardId(null)} className="px-5 bg-white/5 text-white/40 text-[10px] font-black uppercase rounded-xl hover:text-white transition-all">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className={cn("text-xs font-semibold leading-snug flex-1", card.isDeactivated ? "text-white/20 line-through" : "text-foreground")}>{card.prompt}</p>
                          <div className="flex gap-1 shrink-0">
                            <button 
                              onClick={() => {
                                setFlashcards(prev => prev.map(c => c.id === card.id ? { ...c, isDeactivated: !c.isDeactivated, mutedUntil: undefined } : c));
                              }}
                              className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                card.isDeactivated ? "bg-red-500/20 text-red-500" : (card.mutedUntil && card.mutedUntil > Date.now()) ? "bg-yellow-400/20 text-yellow-400" : "bg-white/5 text-white/30 hover:text-white"
                              )}
                              title={card.isDeactivated ? "Reactivar" : "Desactivar/Muteado"}
                            >
                              {card.isDeactivated ? <BellOff size={10} /> : <Bell size={10} />}
                            </button>
                             <button 
                               onClick={() => {
                                 if (card.noteId) {
                                   setActiveNoteId(card.noteId);
                                   setActiveTab('Notebook');
                                   setJumpSource('notification');
                                   setIsFlashcardManagerOpen(false);
                                   setTimeout(() => {
                                     window.dispatchEvent(new CustomEvent('luvia-smart-link', { detail: card.markerId || card.sourceText }));
                                   }, 500);
                                 }
                               }}
                               className="w-6 h-6 rounded-lg bg-green-500/5 hover:bg-green-500/20 text-green-500/40 hover:text-green-500 flex items-center justify-center transition-all"
                               title="Ir al texto"
                             >
                               <ArrowRight size={10} />
                             </button>
                            <button onClick={() => { setEditingFlashcardId(card.id); setEditFlashcardForm({ prompt: card.prompt, reveal: card.reveal, intervalType: card.intervalType, intervalValue: card.intervalValue, durationSeconds: card.durationSeconds }); }} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white flex items-center justify-center transition-all">
                              <Pencil size={10} />
                            </button>
                            <button 
                              onClick={() => {
                                setFlashcards(prev => {
                                  const cardToDelete = prev.find(c => c.id === card.id);
                                  if (cardToDelete?.markerId) {
                                     window.dispatchEvent(new CustomEvent('luvia-remove-reminder', { detail: cardToDelete.markerId }));
                                  }
                                  return prev.filter(c => c.id !== card.id);
                                });
                              }} 
                              className="w-6 h-6 rounded-lg bg-red-500/5 hover:bg-red-500/20 text-red-500/30 hover:text-red-500 flex items-center justify-center transition-all"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                        {card.noteTitle && (
                          <p className="text-[9px] text-white/25 font-bold mb-2 flex items-center gap-1">
                            <span className="text-yellow-400/30">📂</span>
                            {card.folderPath ? `${card.folderPath} / ` : ''}{card.noteTitle}
                          </p>
                        )}
                        {card.sourceText && (
                          <p className="text-[9px] text-white/20 italic mb-2 truncate">&ldquo;{card.sourceText}&rdquo;</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                            card.isDeactivated 
                              ? "bg-red-500/10 text-red-500 border-red-500/10" 
                              : (card.mutedUntil && card.mutedUntil > Date.now())
                                ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/10"
                                : "bg-yellow-400/5 text-yellow-400/50 border-yellow-400/10"
                          )}>
                            {card.isDeactivated ? 'Desactivado' : (card.mutedUntil && card.mutedUntil > Date.now()) ? 'Silenciado' : `cada ${card.intervalValue < 1 ? 'poco' : Math.round(card.intervalValue)} ${card.intervalType === 'second' ? 'seg' : card.intervalType === 'minute' ? 'min' : card.intervalType === 'hour' ? 'hora' : card.intervalType === 'day' ? 'día' : 'sem'}`}
                          </span>
                          <span className="text-[9px] text-white/20 font-bold">{card.durationSeconds}s visible</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Back to Quiz Floating Banner */}
        {jumpSource && activeTab === 'Notebook' && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-top fade-in duration-300">
            <div className="flex items-center gap-3 bg-primary/95 backdrop-blur-md rounded-2xl px-5 py-3 shadow-[0_8px_30px_rgba(var(--primary),0.4)] border border-primary/50 keep-dark">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white italic">
                {jumpSource === 'notification' ? 'Modo Recordatorio — Viendo referencia' :
                 jumpSource === 'question-desk' ? 'Question Desk — Viendo referencia' :
                 'Modo Jump In — Viendo referencia'}
              </span>
              <button
                onClick={() => {
                  const targetTab = (jumpSource === 'notification' || jumpSource === 'quiz') ? 'Quiz' : 'Quiz';
                  setJumpSource(null);
                  setActiveTab(targetTab);
                }}
                className="ml-2 bg-white/20 hover:bg-white/30 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all"
              >
                ← {jumpSource === 'question-desk' ? 'Back to Desk' : 'Back to Quiz'}
              </button>
              <button onClick={() => setJumpSource(null)} className="text-white/50 hover:text-white transition-colors ml-1">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <Toaster />
      </div>
    </TooltipProvider>
  );
}
