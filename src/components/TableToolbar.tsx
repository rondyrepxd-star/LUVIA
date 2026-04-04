"use client";

import React from 'react';
import { 
  Trash2, ArrowUp, ArrowDown, 
  ArrowLeft, ArrowRight, X, LayoutGrid, ChevronDown,
  Grid2X2,
  Layout,
  Eraser,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TableToolbarProps {
  position: { x: number; y: number };
  activeCell: HTMLTableCellElement;
  onClose: () => void;
  onUpdate: () => void;
}

const colors = [
  { name: 'None', value: '' },
  { name: 'Lavender', value: '#818cf8' },
  { name: 'Sky', value: '#38bdf8' },
  { name: 'Emerald', value: '#34d399' },
  { name: 'Amber', value: '#fbbf24' },
  { name: 'Rose', value: '#fb7185' },
  { name: 'Slate', value: '#475569' },
];

const TableToolbar = ({ position, activeCell, onClose, onUpdate }: TableToolbarProps) => {
  const table = activeCell.closest('table');
  if (!table) return null;

  const isClassic = table.classList.contains('table-classic');

  const handleAction = (action: () => void) => {
    action();
    onUpdate();
  };

  const setCellColor = (color: string) => {
    activeCell.style.backgroundColor = color ? `${color}22` : '';
    if (color) {
      activeCell.style.setProperty('--cell-border-color', color);
    } else {
      activeCell.style.removeProperty('--cell-border-color');
    }
  };

  const clearCell = () => {
    activeCell.innerHTML = '';
    activeCell.style.backgroundColor = '';
    activeCell.style.removeProperty('--cell-border-color');
  };

  const setTableModel = (model: 'classic' | 'cards') => {
    if (!table) return;
    table.classList.remove('table-classic', 'table-cards');
    table.classList.add(`table-${model}`);
  };

  const adjustWidth = (amount: number) => {
    if (!table) return;
    const currentWidth = parseInt(table.style.getPropertyValue('--cell-width') || '160');
    table.style.setProperty('--cell-width', `${Math.max(100, currentWidth + amount)}px`);
  };

  const resetTable = () => {
    if (!table) return;
    table.style.removeProperty('--cell-width');
    table.style.removeProperty('--cell-height');
    table.querySelectorAll('td, th').forEach((cell: any) => {
      cell.style.backgroundColor = '';
      cell.style.removeProperty('--cell-border-color');
    });
  };

  const insertRow = (before: boolean) => {
    const row = activeCell.closest('tr');
    if (!row || !row.parentNode) return;
    const newRow = document.createElement('tr');
    const cellCount = row.children.length;
    for (let i = 0; i < cellCount; i++) {
      const cell = document.createElement('td');
      cell.innerHTML = '';
      newRow.appendChild(cell);
    }
    if (before) row.parentNode.insertBefore(newRow, row);
    else row.parentNode.insertBefore(newRow, row.nextSibling);
  };

  const deleteRow = () => {
    const row = activeCell.closest('tr');
    if (row) row.remove();
    onClose();
  };

  const insertColumn = (before: boolean) => {
    const cellIndex = activeCell.cellIndex;
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cell = document.createElement('td');
      cell.innerHTML = '';
      const targetCell = row.children[cellIndex];
      if (before) row.insertBefore(cell, targetCell);
      else row.insertBefore(cell, targetCell.nextSibling);
    });
  };

  const deleteColumn = () => {
    const cellIndex = activeCell.cellIndex;
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      if (row.cells[cellIndex]) row.deleteCell(cellIndex);
    });
    onClose();
  };

  const deleteTable = () => {
    table.remove();
    onClose();
  };

  return (
    <TooltipProvider>
      <div 
        className="fixed z-[60] flex items-center bg-[#121212]/90 border border-white/10 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] p-1.5 backdrop-blur-xl animate-in zoom-in-95 fade-in duration-200"
        style={{ left: position.x, top: position.y, transform: 'translateX(-50%) translateY(-120%)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Color & Cleanup */}
        <div className="flex items-center gap-1 px-1 border-r border-white/5">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                      style={{ backgroundColor: activeCell.style.getPropertyValue('--cell-border-color') || 'transparent' }}
                    />
                    <ChevronDown size={12} className="opacity-40" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-black text-[9px] font-black uppercase border-white/10">Cell Background</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-48 p-3 bg-[#181818] border-white/10 shadow-2xl rounded-2xl">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 px-1 italic">Cell Background</p>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleAction(() => setCellColor(color.value))}
                    className={cn(
                      "w-8 h-8 rounded-lg border border-white/5 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center overflow-hidden",
                      !color.value ? "bg-transparent" : ""
                    )}
                    style={{ backgroundColor: color.value || 'transparent' }}
                    title={color.name}
                  >
                    {!color.value && <X size={12} className="text-white/20" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <ToolbarButton icon={<Eraser size={16} />} label="Clear Cell" onClick={() => handleAction(clearCell)} />
        </div>

        {/* Tamaño - Solo Width si es Moderno */}
        {!isClassic && (
          <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20 [writing-mode:vertical-lr] rotate-180 italic mr-1">WIDTH</span>
            <ToolbarButton icon={<Maximize2 size={16} className="rotate-90" />} label="Expand Width" onClick={() => handleAction(() => adjustWidth(20))} />
            <ToolbarButton icon={<Minimize2 size={16} className="rotate-90" />} label="Shrink Width" onClick={() => handleAction(() => adjustWidth(-20))} />
          </div>
        )}

        {/* Filas */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 [writing-mode:vertical-lr] rotate-180 italic mr-1">ROW</span>
          <ToolbarButton icon={<ArrowUp size={16} />} label="Insert Before" onClick={() => handleAction(() => insertRow(true))} />
          <ToolbarButton icon={<ArrowDown size={16} />} label="Insert After" onClick={() => handleAction(() => insertRow(false))} />
          <ToolbarButton icon={<X size={16} className="text-destructive/60" />} label="Delete Row" onClick={() => handleAction(deleteRow)} />
        </div>

        {/* Columnas */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 [writing-mode:vertical-lr] rotate-180 italic mr-1">COLUM</span>
          <ToolbarButton icon={<ArrowLeft size={16} />} label="Insert Left" onClick={() => handleAction(() => insertColumn(true))} />
          <ToolbarButton icon={<ArrowRight size={16} />} label="Insert Right" onClick={() => handleAction(() => insertColumn(false))} />
          <ToolbarButton icon={<X size={16} className="text-destructive/60" />} label="Delete Column" onClick={() => handleAction(deleteColumn)} />
        </div>

        {/* General */}
        <div className="flex items-center gap-1 pl-2">
          <ToolbarButton icon={<RotateCcw size={16} />} label="Reset All" onClick={() => handleAction(resetTable)} />
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                    <LayoutGrid size={16} />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-black text-[9px] font-black uppercase border-white/10">Table Settings</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-56 p-2 bg-[#161616] border-white/10 shadow-2xl rounded-xl">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 p-2 italic">Table Models</p>
                <button 
                  onClick={() => handleAction(() => setTableModel('classic'))}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white transition-all"
                >
                  <Grid2X2 size={16} className="text-primary" />
                  Classic (Grid)
                </button>
                <button 
                  onClick={() => handleAction(() => setTableModel('cards'))}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white transition-all"
                >
                  <Layout size={16} className="text-accent" />
                  Modern (Cards)
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <ToolbarButton icon={<Trash2 size={16} />} label="Delete Table" onClick={() => handleAction(deleteTable)} />
        </div>
      </div>
    </TooltipProvider>
  );
};

const ToolbarButton = ({ icon, label, onClick, className }: { icon: React.ReactNode, label: string, onClick: () => void, className?: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button 
        onClick={onClick}
        className={cn("p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all", className)}
      >
        {icon}
      </button>
    </TooltipTrigger>
    <TooltipContent className="bg-black text-[9px] font-black uppercase border-white/10">{label}</TooltipContent>
  </Tooltip>
);

export default TableToolbar;