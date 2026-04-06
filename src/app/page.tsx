"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Zap
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

export type NotebookWidth = 'standard' | 'wide' | 'full';

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
  const [appTheme, setAppTheme] = useState('default');
  const [notebookFont, setNotebookFont] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [notebookFontSize, setNotebookFontSize] = useState(18);
  const [notebookWidth, setNotebookWidth] = useState<NotebookWidth>('wide');
  const [isSpellcheckEnabled, setIsSpellcheckEnabled] = useState(true);
  const [masterQuizData, setMasterQuizData] = useState<GenerateQuizOutput | null>(null);
  
  const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // State for intelligent import
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

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
    
    localStorage.setItem('luvia_notes', JSON.stringify(notes));
    localStorage.setItem('luvia_folders', JSON.stringify(folders));
    localStorage.setItem('luvia_font', notebookFont);
    localStorage.setItem('luvia_font_size', notebookFontSize.toString());
    localStorage.setItem('luvia_width', notebookWidth);
    localStorage.setItem('luvia_sidebar_collapsed', String(isSidebarCollapsed));
    localStorage.setItem('luvia_spellcheck', String(isSpellcheckEnabled));
    localStorage.setItem('luvia_theme', appTheme);
    if (activeNoteId) localStorage.setItem('luvia_active_id', activeNoteId);
  }, [notes, folders, activeNoteId, notebookFont, notebookFontSize, notebookWidth, isSidebarCollapsed, isSpellcheckEnabled, appTheme, isInitialLoadDone]);

  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId) || null
  , [notes, activeNoteId]);

  const updateActiveNote = (updates: Partial<StudyNote>) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => 
      n.id === activeNoteId ? { ...n, ...updates, lastModified: Date.now() } : n
    ));
  };

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

  const renderContent = () => {
    if (!activeNote) {
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

    switch (activeTab) {
      case 'Notebook':
        return (
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
        );
      case 'Chat':
        return (
          <ChatView 
            noteContent={activeNote.content} 
            history={activeNote.chatHistory || []}
            setHistory={(newHistory) => updateActiveNote({ chatHistory: newHistory })}
            pastSessions={activeNote.pastChatSessions || []}
            setPastSessions={(newSessions) => updateActiveNote({ pastChatSessions: newSessions })}
          />
        );
      case 'Quiz':
        return (
          <QuizView 
            currentNoteId={activeNote.id}
            noteContent={activeNote.content} 
            quiz={activeNote.quiz || null} 
            setQuiz={(val) => updateActiveNote({ quiz: val || undefined })} 
          />
        );
      case 'MasterQuiz':
        return (
          <MasterQuizView 
            notes={notes}
            folders={folders}
            onSelectNote={(id) => {
              setActiveNoteId(id);
              setActiveTab('Quiz');
            }}
            onStartMasterQuiz={handleStartMasterQuiz}
          />
        );
      case 'MasterQuizSession':
        return (
          <QuizView 
            currentNoteId="master-quiz"
            noteContent="" 
            quiz={masterQuizData} 
            setQuiz={(val) => setMasterQuizData(val)} 
            onExit={() => setActiveTab('MasterQuiz')}
            autoStart={true}
          />
        );
      default:
        return null;
    }
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
        "flex h-screen bg-[#0d0d0f] text-foreground overflow-hidden font-body",
        appTheme === 'aurora' ? 'theme-aurora' : '',
        appTheme === 'crimson' ? 'theme-crimson' : '',
        appTheme === 'emerald' ? 'theme-emerald' : ''
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

        <div className={cn("transition-all duration-300 overflow-hidden shrink-0 z-40 bg-[#0d0d0f] md:bg-transparent absolute inset-y-0 left-0 md:relative", isSidebarCollapsed ? "-translate-x-full md:translate-x-0 md:w-12" : "translate-x-0 w-64 md:w-64")}>
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
            onTabChange={setActiveTab}
          />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          {!isFocusMode && (
            <div className="z-30 bg-[#0d0d0f]/50 backdrop-blur-xl border-b border-white/5 shrink-0 flex-none">
              <div className="flex items-center justify-between px-3 md:px-8 h-16 gap-2">
                {activeNote && (
                  <div className="bg-[#141416] p-1 rounded-2xl inline-flex items-center gap-1 shadow-xl border border-white/5 shrink-0">
                    {tabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
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
                      className="bg-transparent border-none outline-none text-[13px] font-bold text-white/90 w-full max-w-[150px] md:max-w-[400px] truncate focus:ring-0 placeholder:text-white/20"
                      placeholder="Note Title"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1 shrink-0">
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
        
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
