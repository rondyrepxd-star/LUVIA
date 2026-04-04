
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ChevronRight, Folder, Book, Code, Zap, Globe, Music, 
  GraduationCap, FlaskConical, Calculator, Languages, 
  Palette, Activity, Brain, Compass, Microscope, Hourglass,
  Plus, Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Folder as FolderType } from '@/app/page';

interface FolderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderType;
  onUpdate: (folder: FolderType) => void;
  noteCount: number;
}

const icons = [
  { id: 'Folder', icon: <Folder size={20} /> },
  { id: 'Book', icon: <Book size={20} /> },
  { id: 'Code', icon: <Code size={20} /> },
  { id: 'Zap', icon: <Zap size={20} /> },
  { id: 'Globe', icon: <Globe size={20} /> },
  { id: 'Music', icon: <Music size={20} /> },
  { id: 'GraduationCap', icon: <GraduationCap size={20} /> },
  { id: 'FlaskConical', icon: <FlaskConical size={20} /> },
  { id: 'Calculator', icon: <Calculator size={20} /> },
  { id: 'Languages', icon: <Languages size={20} /> },
  { id: 'Palette', icon: <Palette size={20} /> },
  { id: 'Activity', icon: <Activity size={20} /> },
  { id: 'Brain', icon: <Brain size={20} /> },
  { id: 'Compass', icon: <Compass size={20} /> },
  { id: 'Microscope', icon: <Microscope size={20} /> },
  { id: 'Hourglass', icon: <Hourglass size={20} /> },
];

const presetColors = [
  '#FF5722', '#E64A19', '#8BC34A', '#388E3C', '#009688', '#00897B',
  '#00796B', '#0288D1', '#1976D2', '#673AB7', '#C2185B', '#AD1457'
];

const FolderEditModal = ({ isOpen, onClose, folder, onUpdate, noteCount }: FolderEditModalProps) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setSelectedColor(folder.color || '#9980e5');
      setSelectedIcon(folder.icon || 'Folder');
    }
  }, [folder, isOpen]);

  if (!folder) return null;

  const handleSave = () => {
    onUpdate({
      ...folder,
      name,
      color: selectedColor,
      icon: selectedIcon
    });
    onClose();
  };

  const truncatePreview = (text: string) => {
    if (text.length > 17) return text.substring(0, 17) + '...';
    return text;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] bg-[#0a0a0a] border-none p-0 overflow-hidden rounded-[2rem] shadow-2xl">
        <DialogHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 text-left">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
            >
              {icons.find(i => i.id === selectedIcon)?.icon || <Folder size={24} />}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter leading-none text-white">
                EDITAR CARPETA
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">
                AJUSTES DE SISTEMA
              </DialogDescription>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
            <X size={24} />
          </button>
        </DialogHeader>

        <div className="p-8 pt-4 grid grid-cols-[1fr_1.2fr] gap-12 text-left">
          {/* Left Column: Preview and Name */}
          <div className="space-y-12">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">VISTA PREVIA</Label>
              <div className="bg-[#111] border border-white/5 rounded-[2rem] p-10 flex items-center gap-6 h-[180px] shadow-inner">
                <div 
                  className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-500"
                  style={{ 
                    backgroundColor: selectedColor, 
                    boxShadow: `0 10px 30px -5px ${selectedColor}50` 
                  }}
                >
                  <div className="text-white scale-[1.5]">
                    {icons.find(i => i.id === selectedIcon)?.icon || <Folder size={20} />}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white truncate max-w-[180px]">
                    {truncatePreview(name || 'NUEVA COLEC...')}
                  </h3>
                  <div className="bg-white/5 px-3 py-1 rounded-full w-fit">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{noteCount} NOTAS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">NOMBRE DE LA CARPETA</Label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                  <ChevronRight size={18} />
                </div>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#111] border-2 border-white/5 focus:border-primary/50 h-16 pl-14 pr-6 rounded-2xl font-black text-lg uppercase italic tracking-tighter transition-all"
                  placeholder="NEW COLLECTION"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Icon and Color Selectors */}
          <div className="space-y-12">
            <div className="space-y-6">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">ICONO TEMÁTICO</Label>
              <div className="grid grid-cols-6 gap-3">
                {icons.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                      selectedIcon === item.id 
                        ? "bg-white text-black scale-110 shadow-xl" 
                        : "bg-white/5 text-white/20 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">COLOR DE CARPETA</Label>
                <button 
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all flex items-center gap-1.5 italic"
                >
                  <Plus size={10} /> PERSONALIZADO
                </button>
                <input 
                  type="color" 
                  ref={colorInputRef} 
                  className="hidden" 
                  onChange={(e) => setSelectedColor(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-6 gap-3">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-11 h-11 rounded-xl transition-all duration-200 flex items-center justify-center hover:rotate-6",
                      selectedColor === color && "ring-4 ring-white/10 scale-95"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Check size={18} className="text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 border-t border-white/5 flex flex-row items-center justify-end gap-8 bg-black/40">
          <button 
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors italic"
          >
            CANCEL
          </button>
          <Button 
            onClick={handleSave}
            className="h-14 px-10 bg-primary hover:bg-primary/90 rounded-2xl flex items-center gap-3 shadow-2xl shadow-primary/20 transition-all active:scale-95"
          >
            <div className="p-1 bg-white/20 rounded-lg">
              {icons.find(i => i.id === selectedIcon)?.icon || <Folder size={16} />}
            </div>
            <span className="font-black text-sm uppercase italic tracking-tighter">EDIT FOLDER</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FolderEditModal;
