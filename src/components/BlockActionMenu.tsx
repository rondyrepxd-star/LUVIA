"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Trash2, Copy, ClipboardCopy, RefreshCcw, 
  Palette, ChevronRight, Hash, Heading1, Heading2, 
  List, ListOrdered, Quote, Square, MoveHorizontal, Plus, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockActionMenuProps {
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onTurnInto: (tag: string) => void;
  onColor: (color: string) => void;
}

const ACTIONS = [
  { id: 'delete', label: 'Delete', icon: <Trash2 size={16} />, shortcut: 'Del', color: 'text-destructive' },
  { id: 'duplicate', label: 'Duplicate', icon: <Copy size={16} />, shortcut: '⌘+D' },
  { id: 'copy', label: 'Copy', icon: <ClipboardCopy size={16} /> },
  { id: 'turn-into', label: 'Turn into', icon: <RefreshCcw size={16} />, hasSubmenu: true },
  { id: 'color', label: 'Color', icon: <Palette size={16} />, hasSubmenu: true },
];

const BLOCK_TYPES = [
  { label: 'Texto', tag: 'p', icon: <Hash size={14} />, desc: 'Párrafo simple' },
  { label: 'Título 1', tag: 'h1', icon: <Heading1 size={14} />, desc: 'Título grande' },
  { label: 'Subtítulo', tag: 'h2', icon: <Heading2 size={14} />, desc: 'Cabecera de sección' },
  { label: 'Lista', tag: 'ul', icon: <List size={14} />, desc: 'Lista de puntos' },
  { label: 'Lista Numerada', tag: 'ol', icon: <ListOrdered size={14} />, desc: 'Lista con orden' },
  { label: 'Cita', tag: 'blockquote', icon: <Quote size={14} />, desc: 'Bloque de referencia' },
  { label: 'To-do', tag: 'todo', icon: <Square size={14} />, desc: 'Lista de tareas' },
  { label: 'Divisor', tag: 'hr', icon: <MoveHorizontal size={14} />, desc: 'Línea separadora' },
];

const DEFAULT_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Rosa', value: '#E91E63' },
  { name: 'Índigo', value: '#3F51B5' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Ámbar', value: '#F59E0B' },
  { name: 'Cielo', value: '#0EA5E9' },
  { name: 'Violeta', value: '#8B5CF6' },
  { name: 'Rojo', value: '#EF4444' },
];

export const BlockActionMenu = ({ onDelete, onDuplicate, onCopy, onTurnInto, onColor }: BlockActionMenuProps) => {
  const [search, setSearch] = useState('');
  const [submenu, setSubmenu] = useState<'turn-into' | 'color' | null>(null);
  const [colors, setColors] = useState(DEFAULT_COLORS);

  useEffect(() => {
    const saved = localStorage.getItem('blockMenuColors');
    if (saved) {
      try {
        setColors(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveColors = (newColors: any[]) => {
    setColors(newColors);
    localStorage.setItem('blockMenuColors', JSON.stringify(newColors));
  };

  const addColor = () => {
    const color = prompt('Introduce el color (hex o nombre):');
    if (color) {
      const newColors = [...colors, { name: 'Personalizado', value: color }];
      saveColors(newColors);
    }
  };

  const deleteColor = (e: React.MouseEvent, value: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (value === 'inherit') return;
    const newColors = colors.filter(c => c.value !== value);
    saveColors(newColors);
  };

  const filteredActions = ACTIONS.filter(a => 
    a.label.toLowerCase().includes(search.toLowerCase())
  );

  if (submenu === 'turn-into') {
    return (
      <div className="w-56 bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl py-2 animate-in slide-in-from-right-2 duration-200">
        <button 
          onClick={() => setSubmenu(null)}
          className="w-full text-left px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors mb-2 flex items-center gap-2"
        >
          <ChevronRight size={12} className="rotate-180" /> Back
        </button>
        {BLOCK_TYPES.map(type => (
          <button
            key={type.tag}
            onClick={() => onTurnInto(type.tag)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-white/70 hover:text-white transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
              {type.icon}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold uppercase tracking-tight">{type.label}</span>
              <span className="text-[9px] text-white/20 font-medium italic">{type.desc}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (submenu === 'color') {
    return (
      <div className="w-56 bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl p-4 animate-in slide-in-from-right-2 duration-200">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setSubmenu(null)}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
          >
            <ChevronRight size={12} className="rotate-180" /> Back
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Colores Favoritos</span>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {colors.map(c => (
            <div key={c.value} className="relative group">
              <button
                onClick={() => onColor(c.value)}
                className="w-10 h-10 rounded-xl border border-white/5 hover:border-primary/50 transition-all flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: c.value === 'inherit' ? 'transparent' : c.value + '15' }}
                title={c.name}
              >
                <div 
                  className="w-4 h-4 rounded-full shadow-lg transition-transform group-hover:scale-125 duration-300" 
                  style={{ backgroundColor: c.value === 'inherit' ? 'white' : c.value }}
                />
              </button>
              
              {c.value !== 'inherit' && (
                <button 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteColor(e, c.value);
                  }}
                >
                  <X size={10} className="text-white" />
                </button>
              )}
            </div>
          ))}
          
          <div className="relative">
            <button
              onClick={() => document.getElementById('new-block-color')?.click()}
              className="w-10 h-10 rounded-xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center text-white/20 hover:text-primary"
            >
              <Plus size={16} />
            </button>
            <input 
              id="new-block-color"
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer w-0 h-0"
              onChange={(e) => {
                const color = e.target.value;
                if (color) {
                  const newColors = [...colors, { name: 'Personalizado', value: color }];
                  saveColors(newColors);
                }
              }}
            />
          </div>
        </div>
        <p className="mt-4 text-[9px] text-white/10 font-bold uppercase tracking-tighter text-center italic">Personaliza tus bloques</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-3 border-b border-white/5 flex items-center gap-2">
        <Search size={14} className="text-white/20" />
        <input 
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search actions..."
          className="bg-transparent border-none outline-none text-[11px] font-medium text-white/80 w-full placeholder:text-white/10"
        />
      </div>

      <div className="py-2">
        {filteredActions.map(action => (
          <button
            key={action.id}
            onClick={() => {
              if (action.hasSubmenu) {
                setSubmenu(action.id as any);
              } else {
                if (action.id === 'delete') onDelete();
                if (action.id === 'duplicate') onDuplicate();
                if (action.id === 'copy') onCopy();
              }
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-all group",
              action.color ? action.color : "text-white/60 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">
                {action.icon}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-tight italic">
                {action.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {action.shortcut && (
                <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">{action.shortcut}</span>
              )}
              {action.hasSubmenu && (
                <ChevronRight size={12} className="opacity-20" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
