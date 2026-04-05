"use client";

import React, { useRef } from 'react';
import { Link as LinkIcon, Globe, FileUp, PlusCircle, FileText, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreate: () => void;
  onFileUpload: (file: File) => void;
}

const AddModal = ({ isOpen, onClose, onNoteCreate, onFileUpload }: AddModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const options = [
    { id: 'url', name: 'From URL', icon: <LinkIcon />, desc: 'Summarize articles or blogs' },
    { id: 'wiki', name: 'Wikipedia', icon: <Globe />, desc: 'Research any topic' },
    { id: 'upload', name: 'Import File', icon: <FileUp />, desc: 'Upload .docx or .pdf' },
    { id: 'note', name: 'Create Note', icon: <PlusCircle />, desc: 'Start a blank notebook' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".docx,.pdf,.txt"
      />
      
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-8 space-y-8 text-left">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Add Content</h2>
              <p className="text-muted-foreground mt-1">Choose a source to start your new study session.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map(option => (
              <Card 
                key={option.id}
                onClick={() => {
                  if (option.id === 'note') onNoteCreate();
                  else if (option.id === 'upload') fileInputRef.current?.click();
                  if (option.id !== 'upload') onClose();
                }}
                className="bg-card border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group active:scale-[0.98]"
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sidebar-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {React.cloneElement(option.icon as React.ReactElement<any>, { size: 24 })}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{option.name}</h3>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground uppercase tracking-widest font-bold">
            <div className="h-px bg-border flex-1" />
            <span>or Drag & Drop any file</span>
            <div className="h-px bg-border flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddModal;
