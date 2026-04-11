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
  Zap,
  FolderDown,
  Sparkles as SparklesIcon
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
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | 'inside' | null>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // --- Handlers ---
  function handleFolderDragStart(e: React.DragEvent, folderId: string) {
    e.dataTransfer.setData('folderId', folderId);
  }

  function handleNoteDragStart(e: React.DragEvent, noteId: string) {
    e.dataTransfer.setData('noteId', noteId);
  }

  function handleDragOver(e: React.DragEvent, id: string, type: 'folder' | 'note') {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    setDragOverId(id);
    if (type === 'folder') {
      if (y < rect.height * 0.25) setDropPosition('above');
      else if (y > rect.height * 0.75) setDropPosition('below');
      else setDropPosition('inside');
    } else {
      if (y < rect.height * 0.5) setDropPosition('above');
      else setDropPosition('below');
    }
  }

  function handleFolderDrop(e: React.DragEvent, targetId: string | undefined, type: 'folder' | 'note' | 'root' | any) {
    e.preventDefault();
    setDragOverId(null);
    setDropPosition(null);

    const folderId = e.dataTransfer.getData('folderId');
    const noteId = e.dataTransfer.getData('noteId');
    
    if (noteId) {
      if (dropPosition === 'above' || dropPosition === 'below') {
        setNotes(prev => {
          const moving = prev.find(n => n.id === noteId);
          if (!moving) return prev;
          
          const filtered = prev.filter(n => n.id !== noteId);
          const targetIndex = filtered.findIndex(n => n.id === targetId);
          
          const newNotes = [...filtered];
          const newParentId = type === 'root' ? undefined : (type === 'note' ? prev.find(n => n.id === targetId)?.folderId : targetId);
          
          if (targetIndex !== -1) {
            newNotes.splice(dropPosition === 'above' ? targetIndex : targetIndex + 1, 0, { ...moving, folderId: newParentId });
          } else {
            newNotes.push({ ...moving, folderId: newParentId });
          }
          return newNotes;
        });
      } else {
        if (type === 'root') {
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId: undefined } : n));
          return;
        }
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId: targetId } : n));
        if (targetId && type === 'folder') {
          setFolders(prev => prev.map(f => f.id === targetId ? { ...f, isOpen: true } : f));
        }
      }
      return;
    }

    if (folderId) {
      if (folderId === targetId) return;
      
      const isDescendant = (parentId: string, childId: string): boolean => {
        const child = folders.find(f => f.id === childId);
        if (!child || !child.parentId) return false;
        if (child.parentId === parentId) return true;
        return isDescendant(parentId, child.parentId);
      };
      
      if (targetId && isDescendant(folderId, targetId)) return;

      if (dropPosition === 'above' || dropPosition === 'below') {
        setFolders(prev => {
          const moving = prev.find(f => f.id === folderId);
          if (!moving) return prev;
          
          const filtered = prev.filter(f => f.id !== folderId);
          const targetIndex = filtered.findIndex(f => f.id === targetId);
          if (targetIndex === -1) return prev;
          
          const newFolders = [...filtered];
          const newParentId = type === 'root' ? undefined : (folders.find(f => f.id === targetId)?.parentId);
          
          newFolders.splice(dropPosition === 'above' ? targetIndex : targetIndex + 1, 0, {
            ...moving,
            parentId: newParentId
          });
          return newFolders;
        });
      } else {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parentId: type === 'root' ? undefined : targetId } : f));
        if (targetId && type === 'folder') {
          setFolders(prev => prev.map(f => f.id === targetId ? { ...f, isOpen: true } : f));
        }
      }
    }
  }

  function handleNoteDrop(e: React.DragEvent, targetId?: string) {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    if (noteId) {
       setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId: targetId } : n));
    }
  }

  const handleToggleFolder = (id: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  const startEditing = (id: string, initialValue: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(id);
    setEditValue(initialValue);
  };
  const saveEdit = () => {
    if (!editingId) return;
    const isFolder = folders.some(f => f.id === editingId);
    if (isFolder) setFolders(prev => prev.map(f => f.id === editingId ? { ...f, name: editValue || f.name } : f));
    else setNotes(prev => prev.map(n => n.id === editingId ? { ...n, title: editValue || n.title } : n));
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
    if (activeNoteId && notes.filter(n => n.folderId === id).some(n => n.id === activeNoteId)) onSelectNote(null);
    setFolderToDelete(null);
  };
  const handleNewNoteClick = (folderId?: string) => {
    if (folderId) setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isOpen: true } : f));
    const newId = onCreateNote(folderId);
    setTimeout(() => startEditing(newId, 'New Note'), 50);
  };
  const handleNewFolderClick = (parentId?: string) => {
    const newId = onCreateFolder(parentId);
    setTimeout(() => startEditing(newId, parentId ? 'New Sub-collection' : 'New Collection'), 50);
  };
  const handleExportFolder = (folder: FolderType) => {
    const collectData = (currentFolder: FolderType): any => ({
      folder: currentFolder,
      notes: notes.filter(n => n.folderId === currentFolder.id),
      subfolders: folders.filter(f => f.parentId === currentFolder.id).map(sub => collectData(sub))
    });
    const exportData = { type: 'luvia_folder_export', data: collectData(folder) };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Luvia_Collection_${folder.name}.luvia`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setFolderToDownload(null);
  };
  const truncateName = (name: string) => name.length > 17 ? name.substring(0, 17) + '...' : name;

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-[#0d0d0f] border-r border-white/5 flex flex-col items-center py-6 h-full shadow-2xl">
        <Button variant="ghost" size="icon" onClick={onToggle} className="text-muted-foreground hover:text-primary mb-auto">
          <ChevronRight size={20} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenSettings} className="text-muted-foreground hover:text-primary mt-auto">
          <Settings size={20} />
        </Button>
      </aside>
    );
  }

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderFolderItems = (folderId: string, depth: number = 0) => {
    const subFolders = folders.filter(f => f.parentId === folderId);
    const folderNotes = filteredNotes.filter(n => n.folderId === folderId);
    const indent = Math.min(depth, 2) * 8;

    return (
      <div className="py-1 space-y-1 border-l border-border/20 overflow-hidden min-w-0" style={{ marginLeft: `${indent}px` }}>
        {folderNotes.map((note) => (
          <div 
            key={note.id} 
            draggable 
            onDragStart={(e) => handleNoteDragStart(e, note.id)}
            onDragOver={(e) => handleDragOver(e, note.id, 'note')}
            onDrop={(e) => handleFolderDrop(e, note.id, 'note')}
            onDragLeave={() => { setDragOverId(null); setDropPosition(null); }}
            onClick={() => onSelectNote(note.id)} 
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer group/note transition-all", 
              activeNoteId === note.id ? "bg-[#252525] text-foreground font-bold" : "text-muted-foreground hover:text-foreground hover:bg-[#202020]",
              dragOverId === note.id && (dropPosition === 'above' || dropPosition === 'below') && "ring-1 ring-primary"
            )}
          >
            {dragOverId === note.id && dropPosition === 'above' && <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-primary z-50 rounded-full" />}
            {dragOverId === note.id && dropPosition === 'below' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary z-50 rounded-full" />}
            {activeNoteId === note.id && <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />}
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm", activeNoteId === note.id ? "bg-primary text-primary-foreground" : "bg-white/5")}>
              <NoteIcon iconName={note.icon} size={12} />
              {note.quiz && <SparklesIcon size={8} className="absolute -top-1 -right-1 text-primary animate-pulse" />}
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-all">
               <button onClick={(e) => { e.stopPropagation(); setNoteToEdit(note); }} className="p-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors"><Pencil size={11} /></button>
               <button onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }} className="p-1.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-full transition-colors"><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
        {subFolders.map(sub => (
          <div key={sub.id} className="space-y-1">
            <div 
              draggable 
              onDragStart={(e) => handleFolderDragStart(e, sub.id)}
              onDragOver={(e) => handleDragOver(e, sub.id, 'folder')}
              onDrop={(e) => handleFolderDrop(e, sub.id, 'folder')}
              onDragLeave={() => { setDragOverId(null); setDropPosition(null); }}
              className={cn("relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer group/folder transition-all", sub.isOpen ? "bg-primary/5" : "hover:bg-[#252525]", dragOverId === sub.id && dropPosition === 'inside' && "bg-primary/20")} 
              onClick={(e) => { e.stopPropagation(); handleToggleFolder(sub.id); }}
            >
              {dragOverId === sub.id && dropPosition === 'above' && <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-primary z-50 rounded-full" />}
              {dragOverId === sub.id && dropPosition === 'below' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary z-50 rounded-full" />}
              {sub.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <NoteIcon iconName={sub.icon} size={14} />
              {editingId === sub.id ? (
                <input ref={editInputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={handleKeyDown} className="bg-background border border-primary text-xs px-1 rounded outline-none w-full" onClick={(e) => e.stopPropagation()} />
              ) : (
                <span className="text-sm font-medium truncate flex-1">{truncateName(sub.name)}</span>
              )}
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-all">
                <button onClick={(e) => { e.stopPropagation(); handleNewNoteClick(sub.id); }} className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors" title="New Note"><Plus size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); setFolderToDownload(sub); }} className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors" title="Download Folder"><Download size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleNewFolderClick(sub.id); }} className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors" title="New Sub-folder"><FolderDown size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); setFolderToEdit(sub); }} className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors" title="Edit Folder"><Pencil size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); setFolderToDelete(sub.id); }} className="p-1 px-1.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-full transition-colors" title="Delete"><Trash2 size={11} /></button>
              </div>
            </div>
            {sub.isOpen && renderFolderItems(sub.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-[#161616] border-r border-border/40 flex flex-col h-full shadow-2xl">
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
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleFolderDrop(e, undefined)} className="flex items-center px-2 mb-2 gap-2">
            <LayoutGrid size={16} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest text-[9px]">Library</span>
            <button onClick={() => handleNewFolderClick()} className="p-1 hover:text-primary transition-all text-muted-foreground/40"><FolderDown size={14} /></button>
          </div>
          <div className="px-2 mb-4 space-y-1">
            <button onClick={() => onTabChange('MasterQuiz')} className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all", activeTab === 'MasterQuiz' ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5 border border-transparent")}>
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", activeTab === 'MasterQuiz' ? "bg-primary text-primary-foreground shadow-lg" : "bg-white/5")}>
                <Zap size={14} className={cn(activeTab === 'MasterQuiz' ? "fill-primary-foreground" : "")} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">Master Quiz</span>
            </button>
          </div>
          <div className="space-y-1">
            {folders.filter(f => !f.parentId).map((folder) => (
              <div key={folder.id} className="space-y-1">
                <div draggable onDragStart={(e) => handleFolderDragStart(e, folder.id)} onDragOver={(e) => handleDragOver(e, folder.id, 'folder')} onDrop={(e) => handleFolderDrop(e, folder.id, 'folder')} onDragLeave={() => { setDragOverId(null); setDropPosition(null); }} className={cn("relative flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer group/folder transition-all", folder.isOpen ? "bg-primary/5" : "hover:bg-[#252525]", dragOverId === folder.id && dropPosition === 'inside' && "bg-primary/20")} onClick={() => handleToggleFolder(folder.id)}>
                   {dragOverId === folder.id && dropPosition === 'above' && <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-primary z-50 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                   {dragOverId === folder.id && dropPosition === 'below' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary z-50 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                   {folder.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                   <NoteIcon iconName={folder.icon} size={14} />
                   <span className="text-sm font-medium truncate flex-1">{truncateName(folder.name)}</span>
                   
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); handleNewNoteClick(folder.id); }} className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors" title="New Note"><Plus size={11} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setFolderToDownload(folder); }} className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors" title="Download Folder"><Download size={11} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleNewFolderClick(folder.id); }} className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors" title="New Sub-folder"><FolderDown size={11} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setFolderToEdit(folder); }} className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors" title="Edit Folder"><Pencil size={11} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder.id); }} className="p-1 px-1.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-full transition-colors" title="Delete"><Trash2 size={11} /></button>
                   </div>
                </div>
                {folder.isOpen && renderFolderItems(folder.id)}
              </div>
            ))}
            {filteredNotes.filter(n => !n.folderId).map((note) => (
              <div key={note.id} draggable onDragStart={(e) => handleNoteDragStart(e, note.id)} onClick={() => onSelectNote(note.id)} className={cn("relative flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer transition-all", activeNoteId === note.id ? "bg-[#252525] text-foreground font-bold" : "text-muted-foreground hover:bg-[#202020]")}>
                 {activeNoteId === note.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full" />}
                 <NoteIcon iconName={note.icon} size={14} />
                 <span className="text-sm truncate flex-1">{truncateName(note.title)}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 mt-auto border-t border-border/10">
        <Button variant="ghost" onClick={onOpenSettings} className="w-full justify-start gap-3 px-3 py-2 h-auto"><Settings size={18} /><span className="font-semibold text-sm">Settings</span></Button>
      </div>
      <FolderEditModal isOpen={!!folderToEdit} onClose={() => setFolderToEdit(null)} folder={folderToEdit!} onUpdate={(f) => setFolders(prev => prev.map(old => old.id === f.id ? f : old))} noteCount={notes.filter(n => n.folderId === folderToEdit?.id).length} />
      {noteToEdit && <NoteEditModal isOpen={!!noteToEdit} onClose={() => setNoteToEdit(null)} note={noteToEdit} onUpdate={(n) => setNotes(prev => prev.map(old => old.id === n.id ? n : old))} />}
      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the folder and its content.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => folderToDelete && deleteFolderCascading(folderToDelete)} className="bg-destructive hover:bg-destructive/90">Delete All</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete this notebook?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => noteToDelete && confirmDeleteNote(noteToDelete)} className="bg-destructive hover:bg-destructive/90">Delete Notebook</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

export default Sidebar;
