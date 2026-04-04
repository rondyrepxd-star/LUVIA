"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Settings, 
  LayoutGrid, 
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  Folder as FolderIcon,
  ChevronDown,
  Pencil,
  FileText,
  Trash2,
  Sparkles,
  Lock,
  Layers,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudyNote, Folder as FolderType } from '@/app/page';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FolderEditModal from './FolderEditModal';
import NoteEditModal from './NoteEditModal';
import NoteIcon from './NoteIcon';

interface SidebarProps {
  notes: StudyNote[];
  folders: FolderType[];
  activeNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onCreateNote: (folderId?: string) => string;
  onCreateFolder: (parentId?: string) => string;
  setFolders: React.Dispatch<React.SetStateAction<FolderType[]>>;
  setNotes: React.Dispatch<React.SetStateAction<StudyNote[]>>;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings?: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

const Sidebar = ({ 
  notes, 
  folders, 
  activeNoteId, 
  onSelectNote, 
  onCreateNote, 
  onCreateFolder,
  setFolders,
  setNotes,
  isCollapsed,
  onToggle,
  onOpenSettings,
  activeTab,
  onTabChange
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [folderToEdit, setFolderToEdit] = useState<FolderType | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<StudyNote | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [folderToDownload, setFolderToDownload] = useState<FolderType | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-[#0d0d0f] border-r border-white/5 flex flex-col items-center py-6 h-full shadow-2xl transition-all duration-300">
        <Button variant="ghost" size="icon" onClick={onToggle} className="text-muted-foreground hover:text-primary mb-auto">
          <ChevronRight size={20} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenSettings} className="text-muted-foreground hover:text-primary mt-auto">
          <Settings size={20} />
        </Button>
      </aside>
    );
  }

  const handleToggleFolder = (id: string) => {
    setFolders(prev => prev.map(f => 
      f.id === id ? { ...f, isOpen: !f.isOpen } : f
    ));
  };

  const handleUpdateFolder = (updatedFolder: FolderType) => {
    setFolders(prev => prev.map(f => f.id === updatedFolder.id ? updatedFolder : f));
  };

  const handleUpdateNote = (updatedNote: StudyNote) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const startEditing = (id: string, initialValue: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(id);
    setEditValue(initialValue);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const isFolder = folders.some(f => f.id === editingId);
    if (isFolder) {
      setFolders(prev => prev.map(f => f.id === editingId ? { ...f, name: editValue || f.name } : f));
    } else {
      setNotes(prev => prev.map(n => n.id === editingId ? { ...n, title: editValue || n.title } : n));
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditingId(null);
  };

  const confirmDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) onSelectNote(null);
    setNoteToDelete(null);
  };

  const deleteFolderCascading = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id && f.parentId !== id));
    setNotes(prev => prev.filter(n => n.folderId !== id));
    const notesInFolder = notes.filter(n => n.folderId === id);
    if (activeNoteId && notesInFolder.some(n => n.id === activeNoteId)) {
      onSelectNote(null);
    }
    setFolderToDelete(null);
  };

  const handleNewNoteClick = (folderId?: string) => {
    if (folderId) {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isOpen: true } : f));
    }
    const newId = onCreateNote(folderId);
    setTimeout(() => startEditing(newId, 'New Note'), 50);
  };

  const handleNewFolderClick = (parentId?: string) => {
    const newId = onCreateFolder(parentId);
    setTimeout(() => startEditing(newId, parentId ? 'New Sub-collection' : 'New Collection'), 50);
  };
  
  const handleExportFolder = (folder: FolderType) => {
    // Recursive folder and notes collection
    const collectData = (currentFolder: FolderType): any => {
      const subfolders = folders.filter(f => f.parentId === currentFolder.id);
      const folderNotes = notes.filter(n => n.folderId === currentFolder.id);
      
      const children: any[] = subfolders.map(sub => collectData(sub));
      
      return {
        folder: currentFolder,
        notes: folderNotes,
        subfolders: children
      };
    };

    const exportData = {
      type: 'luvia_folder_export',
      export_date: new Date().toISOString(),
      data: collectData(folder)
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Luvia_Collection_${folder.name.replace(/\s+/g, '_')}.luvia`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setFolderToDownload(null);
  };

  const truncateName = (name: string) => {
    if (name.length > 17) return name.substring(0, 17) + '...';
    return name;
  };

  const handleNoteDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('noteId', noteId);
  };

  const handleNoteDrop = (e: React.DragEvent, targetFolderId: string | undefined) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    if (!noteId) return;
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId: targetFolderId } : n));
    if (targetFolderId) {
      setFolders(prev => prev.map(f => f.id === targetFolderId ? { ...f, isOpen: true } : f));
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFolderItems = (folderId: string, depth: number = 0) => {
    const subFolders = folders.filter(f => f.parentId === folderId);
    const folderNotes = filteredNotes.filter(n => n.folderId === folderId);

    return (
      <div className={cn("py-1 space-y-1 border-l border-border/20", depth === 0 ? "ml-9" : "ml-4")}>
        {folderNotes.map((note) => (
          <div 
            key={note.id} 
            draggable 
            onDragStart={(e) => handleNoteDragStart(e, note.id)}
            onClick={() => onSelectNote(note.id)} 
            className={cn("relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer group/note transition-all", activeNoteId === note.id ? "bg-[#252525] text-foreground font-bold" : "text-muted-foreground hover:text-foreground hover:bg-[#202020]")}
          >
            {activeNoteId === note.id && <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />}
            <div 
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm",
                note.color ? "" : (activeNoteId === note.id ? "bg-primary text-primary-foreground" : "bg-white/5 group-hover/note:bg-white/10")
              )}
              style={note.color ? { backgroundColor: `${note.color}20`, color: note.color } : {}}
            >
              <NoteIcon iconName={note.icon} size={12} />
              {note.quiz && <Sparkles size={8} className="absolute -top-1 -right-1 text-primary animate-pulse" />}
            </div>
            {editingId === note.id ? (
              <input
                ref={editInputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={handleKeyDown}
                className="bg-background border border-primary text-[10px] px-1 rounded outline-none w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-xs truncate flex-1">{truncateName(note.title)}</span>
            )}
            <div className="absolute left-1 -top-3 z-20 flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-all duration-200 bg-background/95 backdrop-blur-md border border-border/50 p-1 rounded-full shadow-xl scale-90 group-hover/note:scale-100 origin-left">
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  setNoteToEdit(note);
                }} 
                className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors"
                title="Edit Note"
              >
                <Pencil size={10} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }} className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors" title="Delete"><Trash2 size={10} /></button>
            </div>
          </div>
        ))}

        {subFolders.map(sub => (
          <div key={sub.id} className="space-y-1">
            <div 
              draggable={false}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleNoteDrop(e, sub.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer group/folder transition-all", 
                sub.isOpen ? "bg-primary/5" : "hover:bg-[#252525]"
              )} 
              onClick={(e) => { e.stopPropagation(); handleToggleFolder(sub.id); }}
            >
              {sub.isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
              <div className="shrink-0" style={{ color: sub.color || 'inherit' }}>
                <NoteIcon iconName={sub.icon} size={14} />
              </div>
              {editingId === sub.id ? (
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  className="bg-background border border-primary text-xs font-medium px-1 rounded outline-none w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm font-medium truncate flex-1">{truncateName(sub.name)}</span>
              )}
              <div className="absolute left-1 -top-3 z-20 flex items-center gap-1 opacity-0 group-hover/folder:opacity-100 transition-all duration-200 bg-background/95 backdrop-blur-md border border-border/50 p-1 rounded-full shadow-xl scale-90 group-hover/folder:scale-100 origin-left">
                <button onClick={(e) => { e.stopPropagation(); handleNewNoteClick(sub.id); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="New Note"><Plus size={10} /></button>
                <button onClick={(e) => { e.stopPropagation(); setFolderToDownload(sub); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="Download Folder"><Download size={10} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleNewFolderClick(sub.id); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="New Sub-folder"><FolderPlus size={10} /></button>
                <button onClick={(e) => { e.stopPropagation(); setFolderToEdit(sub); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="Edit Folder"><Pencil size={10} /></button>
                <button onClick={(e) => { e.stopPropagation(); setFolderToDelete(sub.id); }} className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors" title="Delete"><Trash2 size={10} /></button>
              </div>
            </div>
            {sub.isOpen && renderFolderItems(sub.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-[#161616] border-r border-border/40 flex flex-col h-full shadow-2xl transition-all duration-300">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-primary">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-[12px] font-black">L</div>
            <span className="text-sm tracking-tight text-foreground">Luvia</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7 text-muted-foreground hover:bg-[#252525]">
            <ChevronLeft size={16} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-2">
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleNoteDrop(e, undefined)}
            className="flex items-center px-2 mb-2 gap-2"
          >
            <LayoutGrid size={16} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">Library</span>
            <button 
              onClick={(e) => { e.preventDefault(); handleNewFolderClick(); }} 
              className="p-1 hover:bg-[#252525] rounded-lg transition-all text-muted-foreground hover:text-primary ml-1"
              title="Add Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>
          <div className="px-2 mb-4 space-y-1">
            <button 
              onClick={() => onTabChange('MasterQuiz')}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group/mq",
                activeTab === 'MasterQuiz' ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
              )}
            >
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all", activeTab === 'MasterQuiz' ? "bg-primary text-primary-foreground shadow-lg" : "bg-white/5 group-hover/mq:bg-white/10")}>
                <Zap size={14} className={cn(activeTab === 'MasterQuiz' ? "fill-primary-foreground" : "")} />
              </div>
              <span className="text-[11px] font-black uppercase italic tracking-widest">Master Quiz</span>
              {activeTab === 'MasterQuiz' && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
            </button>
          </div>

          <div className="space-y-1">
            {folders.length === 0 && notes.length === 0 ? (
              <div className="mt-8 px-4 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center mx-auto transition-colors group-hover:border-primary/40">
                  <FolderPlus size={24} className="text-primary/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">Librería vacía</p>
                  <button 
                    onClick={() => handleNewFolderClick()}
                    className="text-xs font-black uppercase italic tracking-tighter text-primary hover:text-white transition-colors"
                  >
                    Crea tu primera carpeta
                  </button>
                </div>
              </div>
            ) : (
              <>
                {folders.filter(f => !f.parentId).map((folder) => (
                  <div key={folder.id} className="space-y-1">
                    <div 
                      draggable={false}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleNoteDrop(e, folder.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer group/folder transition-all", 
                        folder.isOpen ? "bg-primary/5" : "hover:bg-[#252525]"
                      )} 
                      onClick={() => handleToggleFolder(folder.id)}
                    >
                      {folder.isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                      <div className="shrink-0" style={{ color: folder.color || 'inherit' }}>
                        <NoteIcon iconName={folder.icon} size={14} />
                      </div>
                      {editingId === folder.id ? (
                        <input
                          ref={editInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="bg-background border border-primary text-sm font-medium px-1 rounded outline-none w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm font-medium truncate flex-1">{truncateName(folder.name)}</span>
                      )}
                      <div className="absolute left-1 -top-3 z-20 flex items-center gap-1 opacity-0 group-hover/folder:opacity-100 transition-all duration-200 bg-background/95 backdrop-blur-md border border-border/50 p-1 rounded-full shadow-xl scale-90 group-hover/folder:scale-100 origin-left">
                        <button onClick={(e) => { e.stopPropagation(); handleNewNoteClick(folder.id); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="New Note"><Plus size={10} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setFolderToDownload(folder); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="Download Folder"><Download size={10} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleNewFolderClick(folder.id); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="New Sub-folder"><FolderPlus size={10} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setFolderToEdit(folder); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="Edit Folder"><Pencil size={10} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder.id); }} className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors" title="Delete"><Trash2 size={10} /></button>
                      </div>
                    </div>
                    {folder.isOpen && renderFolderItems(folder.id)}
                  </div>
                ))}

                {filteredNotes.filter(n => !n.folderId).length > 0 && (
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleNoteDrop(e, undefined)}
                    className="pt-4 space-y-1 border-t border-border/10 mt-4"
                  >
                    <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Uncategorized</p>
                    {filteredNotes.filter(n => !n.folderId).map((note) => (
                      <div 
                        key={note.id} 
                        draggable 
                        onDragStart={(e) => handleNoteDragStart(e, note.id)}
                        onClick={() => onSelectNote(note.id)} 
                        className={cn("relative flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer group/note transition-all", activeNoteId === note.id ? "bg-[#252525] text-foreground font-bold" : "text-muted-foreground hover:text-foreground hover:bg-[#202020]")}
                      >
                        {activeNoteId === note.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full" />}
                        <div 
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm",
                            note.color ? "" : (activeNoteId === note.id ? "bg-primary text-primary-foreground" : "bg-white/5 group-hover/note:bg-white/10")
                          )}
                          style={note.color ? { backgroundColor: `${note.color}20`, color: note.color } : {}}
                        >
                          <NoteIcon iconName={note.icon} size={14} />
                          {note.quiz && <Sparkles size={10} className="absolute -top-1 -right-1 text-primary animate-pulse" />}
                        </div>
                        {editingId === note.id ? (
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            className="bg-background border border-primary text-xs font-medium px-1 rounded outline-none w-full"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-sm truncate flex-1">{truncateName(note.title)}</span>
                        )}
                        <div className="absolute left-1 -top-3 z-20 flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-all duration-200 bg-background/95 backdrop-blur-md border border-border/50 p-1 rounded-full shadow-xl scale-90 group-hover/note:scale-100 origin-left">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              setNoteToEdit(note);
                            }} 
                            className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition-colors"
                            title="Edit Note"
                          >
                            <Pencil size={10} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }} className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors" title="Delete"><Trash2 size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t border-border/10">
        <Button 
          variant="ghost" 
          onClick={onOpenSettings} 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-[#252525] px-3 py-2 rounded-xl h-auto"
        >
          <Settings size={18} />
          <span className="font-semibold text-sm">Settings</span>
        </Button>
      </div>

      <FolderEditModal 
        isOpen={!!folderToEdit} 
        onClose={() => setFolderToEdit(null)} 
        folder={folderToEdit!} 
        onUpdate={handleUpdateFolder} 
        noteCount={notes.filter(n => n.folderId === folderToEdit?.id).length}
      />

      {noteToEdit && (
        <NoteEditModal 
          isOpen={!!noteToEdit} 
          onClose={() => setNoteToEdit(null)} 
          note={noteToEdit}
          onUpdate={handleUpdateNote}
        />
      )}

      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the folder and all its content, including sub-folders.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => folderToDelete && deleteFolderCascading(folderToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this notebook and all its content.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => noteToDelete && confirmDeleteNote(noteToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Notebook</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!folderToDownload} onOpenChange={(open) => !open && setFolderToDownload(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Seguro que quieres descargar todo el contenido de la carpeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se descargará un archivo con toda la información de "{folderToDownload?.name}", incluyendo sus notas (notebook, chat y quiz) y subcarpetas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => folderToDownload && handleExportFolder(folderToDownload)} className="bg-primary text-primary-foreground hover:bg-primary/90">Descargar Todo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

export default Sidebar;
