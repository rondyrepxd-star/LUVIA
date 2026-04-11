"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, Link as LinkIcon, 
  Heading1, Heading2, List, ListOrdered, Quote, ChevronDown, ChevronUp,
  Palette, StickyNote, Trash2, X, Check, Clock, Plus, Square,
  Table as TableIcon,
  Minus as MinusIcon,
  ChevronRight,
  Move,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Columns2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FloatingMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  setContent: (val: string) => void;
  activeBlock: { label: string; icon: string };
  setActiveBlock: (val: { label: string; icon: string }) => void;
  activeStyles: any;
  isAnchored?: boolean;
  onToggleAnchor?: () => void;
}

const DEFAULT_COLORS = [
  { name: 'Rosa', value: '#E91E63' },
  { name: 'Índigo', value: '#3F51B5' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Ámbar', value: '#F59E0B' },
  { name: 'Cielo', value: '#0EA5E9' },
  { name: 'Violeta', value: '#8B5CF6' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Naranja', value: '#F97316' },
  { name: 'Lima', value: '#84CC16' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Fucsia', value: '#D946EF' },
  { name: 'Gris', value: '#6B7280' },
];

const fonts = [
  { name: 'Arial', value: 'Arial, sans-serif', type: 'Sans' },
  { name: 'Inter', value: 'Inter, sans-serif', type: 'Sans' },
  { name: 'Roboto', value: 'Roboto, sans-serif', type: 'Sans' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', type: 'Sans' },
  { name: 'Oswald', value: 'Oswald, sans-serif', type: 'Display' },
  { name: 'Abril Fatface', value: 'Abril Fatface, cursive', type: 'Display' },
  { name: 'Playfair Display', value: 'Playfair Display, serif', type: 'Serif' },
  { name: 'Lora', value: 'Lora, serif', type: 'Serif' },
  { name: 'Merriweather', value: 'Merriweather, serif', type: 'Serif' },
  { name: 'Pacifico', value: 'Pacifico, cursive', type: 'Handwriting' },
  { name: 'Dancing Script', value: 'Dancing Script, cursive', type: 'Handwriting' },
  { name: 'Caveat', value: 'Caveat, cursive', type: 'Handwriting' },
  { name: 'Lobster', value: 'Lobster, cursive', type: 'Handwriting' },
  { name: 'Source Code Pro', value: 'Source Code Pro, monospace', type: 'Mono' },
  { name: 'Courier New', value: 'Courier New, monospace', type: 'Mono' },
];

const FloatingMenu = ({ 
  position, 
  onClose, 
  editorRef, 
  setContent, 
  activeBlock,
  setActiveBlock,
  activeStyles,
  isAnchored, 
  onToggleAnchor 
}: FloatingMenuProps) => {
  const { toast } = useToast();
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [showFontSizeSelector, setShowFontSizeSelector] = useState(false);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [showAlignmentSelector, setShowAlignmentSelector] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ r: 0, c: 0 });
  const [gridLimit, setGridLimit] = useState({ r: 5, c: 5 });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [blockShortcuts, setBlockShortcuts] = useState<Record<string, string>>({});
  const [recordingShortcutFor, setRecordingShortcutFor] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blockShortcuts');
      if (saved) setBlockShortcuts(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!recordingShortcutFor) return;
    
    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const parts = [];
      if (e.ctrlKey) parts.push('ctrl');
      if (e.metaKey) parts.push('cmd');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        parts.push(e.key.toLowerCase());
        const combo = parts.join('+');
        
        const updated = { ...blockShortcuts, [recordingShortcutFor]: combo };
        setBlockShortcuts(updated);
        localStorage.setItem('blockShortcuts', JSON.stringify(updated));
        setRecordingShortcutFor(null);
      } else if (e.key === 'Escape') {
        setRecordingShortcutFor(null);
      }
    };
    
    window.addEventListener('keydown', handleCapture, { capture: true });
    return () => window.removeEventListener('keydown', handleCapture, { capture: true });
  }, [recordingShortcutFor, blockShortcuts]);

  const tableGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTableGrid && tableGridRef.current) {
      const updatePosition = () => {
        const node = tableGridRef.current;
        if (!node) return;
        
        node.style.transform = 'translateY(-50%)'; // Reset to default tailwind behavior
        const rect = node.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.bottom > windowHeight - 20) {
          const overflow = rect.bottom - windowHeight + 20;
          node.style.transform = `translateY(calc(-50% - ${overflow}px))`;
        } else if (rect.top < 20) {
          const overflow = 20 - rect.top;
          node.style.transform = `translateY(calc(-50% + ${overflow}px))`;
        }
      };
      
      // Delay allows React to update DOM sizes when hoveredGrid/gridLimit changes
      requestAnimationFrame(() => updatePosition());
    }
  }, [showTableGrid, gridLimit, hoveredGrid]);

  const [linkUrl, setLinkUrl] = useState('');
  const [activeFont, setActiveFont] = useState('Inter');
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedReference, setSelectedReference] = useState('');
  const [fontSize, setFontSize] = useState(3); 
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [noteOffset, setNoteOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [paletteColors, setPaletteColors] = useState(DEFAULT_COLORS);
  const [colorToDelete, setColorToDelete] = useState<string | null>(null);
  
  const noteEditorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const activeHighlightRef = useRef<HTMLElement | null>(null);
  const prevMoveModeRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAnchored && menuRef.current) {
      const node = menuRef.current;
      node.style.transform = isNoteOpen ? `translate(-50%, -50%) translate(${noteOffset.x}px, ${noteOffset.y}px)` : `translateX(-50%) translateY(-100%) translate(${noteOffset.x}px, ${noteOffset.y}px)`;
      
      const checkBounds = () => {
        const rect = node.getBoundingClientRect();
        const padding = 16;
        let dx = 0;
        let dy = 0;

        if (rect.left < padding) {
          dx = padding - rect.left;
        } else if (rect.right > window.innerWidth - padding) {
          dx = (window.innerWidth - padding) - rect.right;
        }

        if (rect.top < padding) {
          // If the menu hits the top of the viewport, push it down so it stays visible
          dy = padding - rect.top;
        }

        if (dx !== 0 || dy !== 0) {
          node.style.transform = isNoteOpen ? `translate(-50%, -50%) translate(${noteOffset.x + dx}px, ${noteOffset.y + dy}px)` : `translateX(-50%) translateY(-100%) translate(${noteOffset.x + dx}px, ${noteOffset.y + dy}px)`;
        }
      };

      // Use rAF to wait for any internal state renders to hit the DOM
      requestAnimationFrame(checkBounds);
    }
  }, [position, isAnchored, isNoteOpen, noteOffset, showBlockSelector, showFontSelector]);

  const findActiveHighlight = useCallback(() => {
    if (isAnchored) return null;
    const hoveredElement = document.elementFromPoint(position.x, position.y + 20) as HTMLElement;
    const highlightFromPoint = hoveredElement?.closest('.notame-highlight') as HTMLElement | null;
    if (highlightFromPoint) return highlightFromPoint;

    const selection = window.getSelection();
    if (!selection) return null;
    const anchor = selection.anchorNode;
    const element = anchor?.nodeType === 3 ? anchor.parentElement : anchor as HTMLElement;
    return element?.closest('.notame-highlight') as HTMLElement | null;
  }, [isAnchored, position.x, position.y]);

  const handleCreateNote = useCallback(() => {
    const activeHighlight = findActiveHighlight();
    if (!activeHighlight) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'notame-highlight';
        span.setAttribute('data-note', '');
        
        try {
          const content = range.extractContents();
          span.appendChild(content);
          range.insertNode(span);
          activeHighlightRef.current = span;
          setSelectedReference(span.innerText);
          setNoteText('');
          setIsNoteOpen(true);
          
          setTimeout(() => {
            if (noteEditorRef.current) noteEditorRef.current.innerHTML = '';
          }, 0);
        } catch (e) {
          console.error("Failed to wrap selection with highlight:", e);
        }

        if (editorRef.current) setContent(editorRef.current.innerHTML);
      }
    } else {
      activeHighlightRef.current = activeHighlight;
      setSelectedReference(activeHighlight.innerText);
      const savedNote = activeHighlight.getAttribute('data-note') || '';
      setNoteText(savedNote);
      setIsNoteOpen(true);
      
      setTimeout(() => {
        if (noteEditorRef.current) {
          noteEditorRef.current.innerHTML = savedNote;
        }
      }, 0);
    }
  }, [findActiveHighlight, editorRef, setContent]);

  useEffect(() => {
    const activeHighlight = findActiveHighlight();
    if (activeHighlight) {
      activeHighlightRef.current = activeHighlight;
      setSelectedReference(activeHighlight.innerText);
      const savedNote = activeHighlight.getAttribute('data-note') || '';
      setNoteText(savedNote);
      setIsNoteOpen(true);
      
      setTimeout(() => {
        if (noteEditorRef.current) {
          noteEditorRef.current.innerHTML = savedNote;
        }
      }, 0);
    } else {
      const selectionText = window.getSelection()?.toString() || '';
      setSelectedReference(selectionText);
    }
  }, [findActiveHighlight]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMoveMode(prev => !prev);
      }

      // Atajo Alt + N para añadir notita
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      }

      if (isMoveMode) {
        const step = 20;
        if (e.key === 'ArrowUp') { e.preventDefault(); setNoteOffset(p => ({ ...p, y: p.y - step })); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setNoteOffset(p => ({ ...p, y: p.y + step })); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); setNoteOffset(p => ({ ...p, x: p.x - step })); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setNoteOffset(p => ({ ...p, x: p.x + step })); }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMoveMode, handleCreateNote]);

  useEffect(() => {
    if (prevMoveModeRef.current !== isMoveMode) {
      if (isMoveMode) {
        toast({ title: "MODO MOVIMIENTO ACTIVADO", description: "Usa flechas o arrastra con el mouse para posicionar el menú." });
      } else {
        toast({ title: "MODO MOVIMIENTO DESACTIVADO" });
      }
      prevMoveModeRef.current = isMoveMode;
    }
  }, [isMoveMode, toast]);

  const handleNoteMouseDown = (e: React.MouseEvent) => {
    if (isMoveMode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - noteOffset.x, y: e.clientY - noteOffset.y });
    }
  };

  const startHandleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - noteOffset.x, y: e.clientY - noteOffset.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setNoteOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleLinkButtonClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      setSavedRange(range.cloneRange());

      let existingUrl = '';
      const container = selection.anchorNode?.parentElement;
      const linkElement = container?.closest('a');
      if (linkElement) {
        existingUrl = linkElement.getAttribute('href') || '';
      }

      setLinkUrl(existingUrl);
      setShowLinkInput(true);
      setShowColorSelector(false);
      setShowBlockSelector(false);
      setShowFontSelector(false);
      setShowFontSizeSelector(false);
      setShowAlignmentSelector(false);
      setShowColumnSelector(false);
    } else {
      toast({
        title: "No hay texto seleccionado",
        description: "Selecciona el texto que quieres enlazar.",
      });
    }
  };

  const applyLink = () => {
    if (savedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
        
        if (linkUrl.trim()) {
          const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
          document.execCommand('createLink', false, url);
          toast({ title: "Enlace aplicado" });
        } else {
          document.execCommand('unlink', false);
          toast({ title: "Enlace eliminado" });
        }
        
        if (editorRef.current) {
          setContent(editorRef.current.innerHTML);
        }
      }
    }
    setShowLinkInput(false);
    setLinkUrl('');
    setSavedRange(null);
  };

  const execCommand = (command: string, value: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0).cloneRange();

    if (command === 'insertTable') {
      const selectedText = selection.toString().trim();
      let tableHtml = '';

      if (selectedText) {
        // Convert selected text to table
        const rowsText = selectedText.split(/\r?\n/).map(row => row.split(/\t| {2,}/));
        const maxCols = Math.max(...rowsText.map(r => r.length));
        
        tableHtml = `
          <table class="table-classic w-full border-collapse my-4">
            <tbody>
              ${rowsText.map(row => `
                <tr>
                  ${row.map(cell => `<td class="p-2 border border-white/20">${cell.trim()}</td>`).join('')}
                  ${Array(Math.max(0, maxCols - row.length)).fill('<td class="p-2 border border-white/20"></td>').join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p><br></p>
        `;
      } else {
        // This is handled by insertSizedTable now for empty tables
        return;
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('insertHTML', false, tableHtml);
    } else if (command === 'insertHorizontalRule') {
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('insertHorizontalRule', false);
    } else if (command === 'fontName') {
      selection.removeAllRanges();
      selection.addRange(range);
      const span = document.createElement('span');
      span.style.fontFamily = value;
      try {
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
      } catch (e) {
        document.execCommand('fontName', false, value);
      }
    } else {
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand(command, false, value);
    }
    
    if (isNoteOpen && noteEditorRef.current) {
      const newHtml = noteEditorRef.current.innerHTML;
      setNoteText(newHtml);
      if (activeHighlightRef.current) {
        activeHighlightRef.current.setAttribute('data-note', newHtml);
        if (editorRef.current) setContent(editorRef.current.innerHTML);
      }
    } else if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const insertSizedTable = (rows: number, cols: number) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0).cloneRange();

    const tableHtml = `
      <table class="table-classic w-full border-collapse my-4">
        <tbody>
          ${Array(rows).fill(`
            <tr>
              ${Array(cols).fill('<td></td>').join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><br></p>
    `;

    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('insertHTML', false, tableHtml);
    
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
    setShowTableGrid(false);
    setShowBlockSelector(false);
  };

  const applyColumns = (count: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const container = selection.anchorNode?.parentElement;
    const block = container?.closest('p, div, h1, h2, h3, blockquote, ul, ol') as HTMLElement;
    
    if (block && editorRef.current?.contains(block)) {
      block.style.columnCount = count.toString();
      block.style.columnGap = count > 1 ? '2rem' : 'normal';
      
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
      toast({ title: `Diseño de ${count} ${count === 1 ? 'columna' : 'columnas'} aplicado` });
    }
  };

  const isTopHeavy = !isAnchored && position.y < 400;

  const handleNoteInput = () => {
    if (noteEditorRef.current) {
      const newHtml = noteEditorRef.current.innerHTML;
      setNoteText(newHtml);
      if (activeHighlightRef.current) {
        activeHighlightRef.current.setAttribute('data-note', newHtml);
        if (editorRef.current) {
          setContent(editorRef.current.innerHTML);
        }
      }
    }
  };

  const handleDeleteNote = () => {
    if (activeHighlightRef.current) {
      const text = activeHighlightRef.current.innerText;
      activeHighlightRef.current.replaceWith(text);
      if (editorRef.current) setContent(editorRef.current.innerHTML);
      toast({ title: "Nota eliminada" });
      setIsNoteOpen(false);
      onClose();
    }
  };

  const toggleMoveModeViaDoubleClick = () => {
    setIsMoveMode(prev => !prev);
  };

  const handleDeleteColor = (value: string) => {
    setPaletteColors(prev => prev.filter(c => c.value !== value));
    setColorToDelete(null);
    toast({ title: "Color eliminado de la paleta" });
  };

  return (
    <TooltipProvider>
      <div 
        ref={menuRef}
        className={cn(
          "flex flex-col items-center gap-2 transition-all duration-300",
          (isNoteOpen || !isAnchored) ? "fixed z-50" : "w-full",
          !isAnchored && "floating-menu-container",
          isNoteOpen && "notame-editor-active"
        )}
        style={{ 
          left: isNoteOpen ? '50%' : (isAnchored ? 'auto' : position.x), 
          top: isNoteOpen ? '50%' : (isAnchored ? 'auto' : position.y), 
          transform: isNoteOpen ? `translate(-50%, -50%) translate(${noteOffset.x}px, ${noteOffset.y}px)` : (isAnchored ? 'none' : `translateX(-50%) translateY(-100%) translate(${noteOffset.x}px, ${noteOffset.y}px)`),
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!isNoteOpen && (
          <div 
            className={cn(
              "bg-[#121212] border border-white/10 rounded-full p-0.5 mb-[-8px] z-20 shadow-xl cursor-pointer hover:bg-white/5 transition-colors",
              isAnchored && "rotate-180 mb-0 mt-[-8px] opacity-20 hover:opacity-100"
            )}
            onClick={onToggleAnchor}
          >
            <ChevronUp size={12} className="text-white/40" />
          </div>
        )}

        {isNoteOpen ? (
          <div className="relative group/note-wrapper">
            {/* TOP drag handle */}
            <div
              className="absolute -top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing group/handle select-none"
              onMouseDown={startHandleDrag}
            >
              <div className="flex items-center gap-1 bg-[#1a1a1e] border border-red-500/40 rounded-full px-3 py-1 shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:bg-red-500/10 hover:border-red-500/70 transition-all duration-200">
                <div className="grid grid-cols-3 gap-[3px]">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full bg-red-400/80 group-hover/handle:bg-red-400" />)}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-red-400/70 group-hover/handle:text-red-400 ml-1.5 transition-colors">MOVER</span>
              </div>
            </div>
            {/* BOTTOM drag handle */}
            <div
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing group/handle select-none"
              onMouseDown={startHandleDrag}
            >
              <div className="flex items-center gap-1 bg-[#1a1a1e] border border-red-500/40 rounded-full px-3 py-1 shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:bg-red-500/10 hover:border-red-500/70 transition-all duration-200">
                <div className="grid grid-cols-3 gap-[3px]">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full bg-red-400/80 group-hover/handle:bg-red-400" />)}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-red-400/70 group-hover/handle:text-red-400 ml-1.5 transition-colors">MOVER</span>
              </div>
            </div>
            {/* LEFT drag handle */}
            <div
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-50 flex flex-row items-center gap-0.5 cursor-grab active:cursor-grabbing group/handle select-none"
              onMouseDown={startHandleDrag}
            >
              <div className="flex flex-col items-center gap-1 bg-[#1a1a1e] border border-red-500/40 rounded-full px-1 py-3 shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:bg-red-500/10 hover:border-red-500/70 transition-all duration-200">
                <div className="grid grid-rows-3 gap-[3px]">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full bg-red-400/80 group-hover/handle:bg-red-400" />)}
                </div>
              </div>
            </div>
            {/* RIGHT drag handle */}
            <div
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-50 flex flex-row items-center gap-0.5 cursor-grab active:cursor-grabbing group/handle select-none"
              onMouseDown={startHandleDrag}
            >
              <div className="flex flex-col items-center gap-1 bg-[#1a1a1e] border border-red-500/40 rounded-full px-1 py-3 shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:bg-red-500/10 hover:border-red-500/70 transition-all duration-200">
                <div className="grid grid-rows-3 gap-[3px]">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full bg-red-400/80 group-hover/handle:bg-red-400" />)}
                </div>
              </div>
            </div>

            <div 
              onMouseDown={handleNoteMouseDown}
              onDoubleClick={toggleMoveModeViaDoubleClick}
              className={cn(
                "bg-[#0f0f11]/95 backdrop-blur-xl border border-white/5 rounded-[1.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] w-[320px] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300",
                isMoveMode ? "cursor-move ring-2 ring-primary/50" : "cursor-default"
              )}
            >
              <div className="p-5 flex justify-between items-start">
                <div className="flex flex-col gap-1 overflow-hidden pr-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary italic">NOMBRE DE NOTA</span>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <p className="text-sm font-black text-white/90 truncate italic">"{selectedReference}"</p>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest shrink-0">• Nota rápida</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    className="text-white/20 hover:text-white transition-colors p-1 ml-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-5 relative group/editor">
                <div
                  ref={noteEditorRef}
                  contentEditable={!isMoveMode}
                  onInput={handleNoteInput}
                  className={cn(
                    "w-full bg-transparent border-none outline-none text-sm font-medium text-white/80 placeholder:text-white/10 min-h-[140px] max-h-[300px] overflow-y-auto scrollbar-hide focus:ring-0",
                    isMoveMode ? "pointer-events-none opacity-50" : ""
                  )}
                  data-placeholder="Escribe tu nota aquí"
                />
                {!noteText && (
                  <div className="absolute top-0 left-5 text-white/10 text-sm italic pointer-events-none">Escribe tu nota aquí</div>
                )}

                {!isMoveMode && (
                  <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl px-3 py-1.5 flex items-center gap-4 opacity-0 group/editor:hover:opacity-100 transition-all duration-300 shadow-xl translate-y-1 group/editor:hover:translate-y-0">
                    <button onClick={() => execCommand('bold')} className="text-white/30 hover:text-white transition-colors"><Bold size={14} /></button>
                    <button onClick={() => execCommand('italic')} className="text-white/30 hover:text-white transition-colors"><Italic size={14} /></button>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 bg-black/40 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] italic">
                  {isMoveMode ? (
                    <div className="flex items-center gap-2 text-primary animate-pulse">
                      <Move size={12} /> MODO MOVER (FLECHAS / MOUSE)
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-green-500/80">
                        <Check size={12} strokeWidth={3} /> GUARDADO
                      </div>
                      <div className="w-px h-3 bg-white/10" />
                      <div className="flex items-center gap-1.5 text-white/20">
                        <Clock size={12} /> AHORA
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleDeleteNote}
                    className="p-2 text-white/20 hover:text-destructive transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            onMouseDown={handleNoteMouseDown}
            onDoubleClick={toggleMoveModeViaDoubleClick}
            className={cn(
              "flex items-center px-1 py-1 transition-all duration-300",
              !isAnchored ? "bg-[#121212] border border-white/10 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md" : "w-full justify-center bg-transparent border-none",
              isMoveMode && !isAnchored && "cursor-move ring-2 ring-primary/50"
            )}
          >
            <div className={cn("relative border-r border-white/5 pr-1 mr-1", isMoveMode && "pointer-events-none opacity-50")}>
              <button 
                onClick={() => {
                  setShowBlockSelector(!showBlockSelector);
                  setShowFontSelector(false);
                  setShowFontSizeSelector(false);
                  setShowColorSelector(false);
                  setShowAlignmentSelector(false);
                  setShowColumnSelector(false);
                  setShowLinkInput(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-white/5 rounded-lg transition-colors text-white/80"
              >
                {activeBlock.label}
                <ChevronDown size={12} className="opacity-40" />
              </button>
              
              {showBlockSelector && (
                <div className={cn(
                  "absolute left-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 w-56 animate-in fade-in zoom-in-95 z-[60]",
                  isAnchored || isTopHeavy ? "top-full mt-2" : "bottom-full mb-2"
                )}>
                  <div className="px-4 py-2 mb-1 border-b border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">TURN IN</span>
                  </div>
                  <ScrollArea className="h-[320px]">
                  {[
                    { label: 'Texto', tag: 'p', icon: <Bold size={14} />, desc: 'Párrafo simple' },
                    { label: 'Título 1', tag: 'h1', icon: <Heading1 size={14} />, desc: 'Título grande' },
                    { label: 'Subtítulo', tag: 'h2', icon: <Heading2 size={14} />, desc: 'Cabecera de sección' },
                    { label: 'Lista', tag: 'ul', icon: <List size={14} />, desc: 'Lista de puntos' },
                    { label: 'Lista Numerada', tag: 'ol', icon: <ListOrdered size={14} />, desc: 'Lista con orden' },
                    { label: 'Cita', tag: 'blockquote', icon: <Quote size={14} />, desc: 'Bloque de referencia' },
                    { label: 'To-do', tag: 'div', icon: <Square size={14} />, desc: 'Lista interactiva de tareas' },
                    { label: 'Toggle', tag: 'div', icon: <ChevronRight size={14} />, desc: 'Crear un bloque desplegable.' },
                    { label: 'Tabla', tag: 'table', icon: <TableIcon size={14} />, desc: 'Grid de 5x3 para datos.' },
                    { label: 'Divisor', tag: 'hr', icon: <MinusIcon size={14} />, desc: 'Línea separadora visual' },
                  ].map(item => (
                    <div key={item.label} className="relative group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              if (recordingShortcutFor) return;
                              if (item.label === 'Tabla') {
                                const selection = window.getSelection();
                                if (selection && selection.toString().trim().length > 0) {
                                  execCommand('insertTable');
                                  setShowBlockSelector(false);
                                } else {
                                  setShowTableGrid(!showTableGrid);
                                }
                              } else {
                                setActiveBlock({ label: item.label, icon: item.tag });
                                if (item.label === 'Lista') {
                                  execCommand('insertUnorderedList');
                                } else if (item.label === 'Lista Numerada') {
                                  execCommand('insertOrderedList');
                                } else if (item.label === 'Divisor') {
                                  execCommand('insertHorizontalRule');
                                } else if (item.label === 'To-do') {
                                  const selectionText = window.getSelection()?.toString().trim();
                                  const todoHtml = `
                                    <div class="todo-item-container" style="display: flex; align-items: flex-start; gap: 0.75rem; margin: 0.5rem 0; width: 100%;">
                                      <div contenteditable="false" style="display: flex; align-items: center; padding-top: 0.2rem; user-select: none;">
                                        <input type="checkbox" onchange="
                                          const p = this.parentElement.nextElementSibling; 
                                          if(this.checked){ 
                                            p.style.textDecoration='line-through'; 
                                            p.style.opacity='0.4'; 
                                            this.style.background='hsl(var(--primary))';
                                            this.style.backgroundImage='url(&quot;data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%224%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%2220 6 9 17 4 12%22%3E%3C/polyline%3E%3C/svg%3E&quot;)';
                                            this.style.backgroundSize='80%';
                                            this.style.backgroundRepeat='no-repeat';
                                            this.style.backgroundPosition='center';
                                          } else { 
                                            p.style.textDecoration='none'; 
                                            p.style.opacity='1'; 
                                            this.style.background='transparent';
                                            this.style.backgroundImage='none';
                                          }" style="appearance: none; -webkit-appearance: none; width: 1.15rem; height: 1.15rem; border: 2.5px solid hsl(var(--primary)); border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: transparent;" />
                                      </div>
                                      <div contenteditable="true" style="flex: 1; outline: none; border: none; padding: 0; margin: 0; min-height: 1.2rem; color: inherit;">${selectionText || 'Nueva nota'}</div>
                                    </div>
                                    <p><br></p>
                                  `;
                                  execCommand('insertHTML', todoHtml);
                                } else if (item.label === 'Toggle') {
                                  const selectionText = window.getSelection()?.toString().trim();
                                  const toggleHtml = `
                                    <div class="toggle-container group" data-state="open" style="margin: 0.5rem 0; width: 100%;">
                                      <div class="toggle-delete" contenteditable="false" onclick="if(confirm('¿Seguro que quieres eliminar este bloque desplegable?')) this.closest('.toggle-container').remove();">
                                        <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>
                                      </div>
                                      <div class="toggle-header" contenteditable="false" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;" 
                                        onclick="const c = this.closest('.toggle-container'); c.setAttribute('data-state', c.getAttribute('data-state') === 'open' ? 'closed' : 'open');">
                                        <div class="toggle-icon" style="color: rgba(255, 255, 255, 0.4); display: flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; transition: transform 0.3s;">
                                          <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>
                                        </div>
                                        <div class="toggle-summary" contenteditable="true" style="flex: 1; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; font-size: 13px; color: rgba(255, 255, 255, 0.8); outline: none;">${selectionText || 'Heading text'}</div>
                                      </div>
                                      <div class="toggle-content" contenteditable="true" style="margin-left: 2rem; margin-top: 0.5rem; font-size: 13px; color: rgba(255, 255, 255, 0.4); outline: none;">Empty toggle block</div>
                                    </div>
                                    <p><br></p>
                                  `;
                                  execCommand('insertHTML', toggleHtml);
                                } else {
                                  execCommand('formatBlock', item.tag);
                                }
                                if (item.label !== 'Tabla') {
                                  setShowBlockSelector(false);
                                }
                              }
                            }}
                            className="flex items-start gap-3 w-full px-4 py-2.5 hover:bg-primary/10 transition-colors text-left"
                          >
                            <div className="mt-0.5 p-1.5 bg-white/5 rounded-md text-white/40 group-hover:text-primary transition-colors">
                              {item.icon}
                            </div>
                            <div className="flex flex-col flex-1 pl-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{item.label}</span>
                              <span className="text-[8px] font-medium text-white/30 uppercase tracking-tight">{item.desc}</span>
                            </div>
                            {item.label === 'Tabla' && (
                              <ChevronDown size={10} className={cn("ml-auto mt-1 opacity-20 group-hover:opacity-100 transition-all mr-12", showTableGrid && "rotate-180")} />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black text-[9px] font-black uppercase z-[70] ml-2">Añadir atajo personalizado</TooltipContent>
                      </Tooltip>
                      
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-[80] opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecordingShortcutFor(recordingShortcutFor === item.label ? null : item.label);
                          }}
                          className={cn(
                            "text-[8px] px-2 py-1 rounded uppercase font-black transition-all",
                            recordingShortcutFor === item.label 
                              ? "bg-primary text-white scale-110 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                              : "bg-black/50 hover:bg-black text-white/50 hover:text-white"
                          )}
                        >
                          {recordingShortcutFor === item.label ? 'PRESIONA...' : (blockShortcuts[item.label] || 'AÑADIR ATAJO')}
                        </button>
                        {blockShortcuts[item.label] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = { ...blockShortcuts };
                              delete updated[item.label];
                              setBlockShortcuts(updated);
                              localStorage.setItem('blockShortcuts', JSON.stringify(updated));
                              if (recordingShortcutFor === item.label) setRecordingShortcutFor(null);
                            }}
                            className="bg-black/50 hover:bg-red-500/80 text-white/50 hover:text-white p-1 rounded transition-all shadow-[0_0_10px_rgba(239,68,68,0)] hover:shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            title="Eliminar atajo"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>

                      {item.label === 'Tabla' && showTableGrid && (
                        <div 
                          ref={tableGridRef}
                          className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-[#111] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-4 animate-in fade-in slide-in-from-left-2 z-[70] w-max min-w-[180px] transition-transform duration-200"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-6 px-1">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 italic">SELECTOR</span>
                                <span className="text-[10px] font-black text-white/50 italic tracking-tighter">TABLA</span>
                              </div>
                              <span className="text-lg font-black text-primary italic drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">{hoveredGrid.c} <span className="text-white/20 text-xs">x</span> {hoveredGrid.r}</span>
                            </div>
                            
                            <div 
                              className="grid gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/5"
                              style={{ 
                                gridTemplateColumns: `repeat(${gridLimit.c}, minmax(0, 1fr))`,
                              }}
                              onMouseLeave={() => setHoveredGrid({ r: 0, c: 0 })}
                            >
                              {Array.from({ length: gridLimit.r }).map((_, r) => (
                                Array.from({ length: gridLimit.c }).map((_, c) => (
                                  <div
                                    key={`${r}-${c}`}
                                    onMouseEnter={() => {
                                      setHoveredGrid({ r: r + 1, c: c + 1 });
                                      const newR = (r + 1 >= gridLimit.r && gridLimit.r < 10) ? gridLimit.r + 1 : gridLimit.r;
                                      const newC = (c + 1 >= gridLimit.c && gridLimit.c < 10) ? gridLimit.c + 1 : gridLimit.c;
                                      if (newR !== gridLimit.r || newC !== gridLimit.c) setGridLimit({ r: newR, c: newC });
                                    }}
                                    onClick={() => insertSizedTable(r + 1, c + 1)}
                                    className={cn(
                                      "w-5 h-5 rounded border border-white/10 transition-all duration-150 cursor-pointer",
                                      (r < hoveredGrid.r && c < hoveredGrid.c) 
                                        ? "bg-primary border-primary shadow-[0_0_10px_rgba(168,85,247,0.5)] scale-105 z-10" 
                                        : "bg-white/5 hover:bg-white/10"
                                    )}
                                  />
                                ))
                              ))}
                            </div>
                            
                            <div className="flex justify-between items-center px-1">
                              <p className="text-[7px] text-white/10 font-black uppercase tracking-widest italic">Dinámico 10x10</p>
                              <div className="flex items-center gap-1">
                                <span className={cn("w-1 h-1 rounded-full", gridLimit.r > 5 ? "bg-primary animate-pulse" : "bg-white/5")} />
                                <span className="text-[7px] font-black text-white/20 italic">{gridLimit.c}x{gridLimit.r}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className={cn("relative border-r border-white/5 pr-1 mr-1", isMoveMode && "pointer-events-none opacity-50")}>
              <button 
                onClick={() => {
                  setShowFontSelector(!showFontSelector);
                  setShowBlockSelector(false);
                  setShowFontSizeSelector(false);
                  setShowColorSelector(false);
                  setShowAlignmentSelector(false);
                  setShowColumnSelector(false);
                  setShowLinkInput(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-white/5 rounded-lg transition-colors text-white/80"
              >
                <span className="truncate max-w-[80px]" style={{ fontFamily: fonts.find(f => f.name === activeFont)?.value }}>{activeFont}</span>
                <ChevronDown size={12} className="opacity-40" />
              </button>
              
              {showFontSelector && (
                <div className={cn(
                  "absolute left-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 w-64 animate-in fade-in zoom-in-95 overflow-hidden z-[60]",
                  isAnchored ? "top-full" : "bottom-full mb-2"
                )}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20 p-3 italic">Galería Tipográfica</p>
                  <ScrollArea className="h-80">
                    {fonts.map(font => (
                      <button
                        key={font.name}
                        onClick={() => {
                          setActiveFont(font.name);
                          execCommand('fontName', font.value);
                          setShowFontSelector(false);
                        }}
                        className={cn(
                          "flex flex-col w-full px-4 py-3 hover:bg-primary/10 transition-colors text-left border-b border-white/5 last:border-0",
                          activeFont === font.name ? "bg-primary/5" : ""
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span 
                            className={cn("text-base", activeFont === font.name ? "text-primary" : "text-white/90")}
                            style={{ fontFamily: font.value }}
                          >
                            {font.name}
                          </span>
                          <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter bg-white/5 px-1.5 py-0.5 rounded">
                            {font.type}
                          </span>
                        </div>
                        <p className="text-[9px] text-white/30 font-medium mt-1 truncate">The quick brown fox jumps over the lazy dog</p>
                      </button>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className={cn("relative border-r border-white/5 pr-1 mr-1", isMoveMode && "pointer-events-none opacity-50")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => {
                      setShowFontSizeSelector(!showFontSizeSelector);
                      setShowBlockSelector(false);
                      setShowFontSelector(false);
                      setShowColorSelector(false);
                      setShowAlignmentSelector(false);
                      setShowColumnSelector(false);
                      setShowLinkInput(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black hover:bg-white/5 rounded-lg transition-colors text-white/80 italic"
                  >
                    {fontSize}
                    <ChevronDown size={12} className="opacity-40" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-[9px] font-black uppercase">Tamaño de fuente</TooltipContent>
              </Tooltip>

              {showFontSizeSelector && (
                <div className={cn(
                  "absolute left-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 w-16 animate-in fade-in zoom-in-95 overflow-hidden z-[60]",
                  isAnchored ? "top-full" : "bottom-full mb-2"
                )}>
                  {[1, 2, 3, 4, 5, 6, 7].map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setFontSize(size);
                        execCommand('fontSize', size.toString());
                        setShowFontSizeSelector(false);
                      }}
                      className={cn(
                        "flex items-center justify-center w-full px-4 py-2 text-[10px] font-black italic hover:bg-primary/10 hover:text-primary transition-colors",
                        fontSize === size ? "text-primary bg-primary/5" : "text-white/60"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={cn("flex items-center gap-0.5 px-2 pr-1 border-r border-white/5 mr-1", isMoveMode && "pointer-events-none opacity-50")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => execCommand('bold')} 
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      activeStyles.bold ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Bold size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-[9px] font-black uppercase">Negrita (Ctrl/Cmd+B)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => execCommand('italic')} 
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      activeStyles.italic ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Italic size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-[9px] font-black uppercase">Cursiva (Ctrl/Cmd+I)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => execCommand('underline')} 
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      activeStyles.underline ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Underline size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-[9px] font-black uppercase">Subrayado (Ctrl/Cmd+U)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => execCommand('strikeThrough')} 
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      activeStyles.strikethrough ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Strikethrough size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-[9px] font-black uppercase">Tachado</TooltipContent>
              </Tooltip>

              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => {
                        setShowAlignmentSelector(!showAlignmentSelector);
                        setShowBlockSelector(false);
                        setShowFontSelector(false);
                        setShowFontSizeSelector(false);
                        setShowColorSelector(false);
                        setShowColumnSelector(false);
                        setShowLinkInput(false);
                      }}
                      className={cn(
                        "flex items-center gap-0.5 p-2 rounded-lg transition-all",
                        showAlignmentSelector ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <AlignLeft size={16} />
                      <ChevronDown size={10} className="opacity-40" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-[9px] font-black uppercase">Alineación</TooltipContent>
                </Tooltip>
                
                {showAlignmentSelector && (
                  <div className={cn(
                    "absolute bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1 flex items-center gap-1 animate-in fade-in zoom-in-95 z-[60]",
                    isAnchored || isTopHeavy ? "top-full mt-2 left-0" : "bottom-full mb-2 left-0"
                  )}>
                    <button onClick={() => { execCommand('justifyLeft'); setShowAlignmentSelector(false); }} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white" title="Izquierda"><AlignLeft size={16} /></button>
                    <button onClick={() => { execCommand('justifyCenter'); setShowAlignmentSelector(false); }} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white" title="Centro"><AlignCenter size={16} /></button>
                    <button onClick={() => { execCommand('justifyRight'); setShowAlignmentSelector(false); }} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white" title="Derecha"><AlignRight size={16} /></button>
                    <button onClick={() => { execCommand('justifyFull'); setShowAlignmentSelector(false); }} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white" title="Justificado"><AlignJustify size={16} /></button>
                  </div>
                )}
              </div>

              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => {
                        setShowColumnSelector(!showColumnSelector);
                        setShowAlignmentSelector(false);
                        setShowBlockSelector(false);
                        setShowFontSelector(false);
                        setShowFontSizeSelector(false);
                        setShowColorSelector(false);
                        setShowLinkInput(false);
                      }}
                      className={cn(
                        "flex items-center gap-0.5 p-2 rounded-lg transition-all",
                        showColumnSelector ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Columns2 size={16} />
                      <ChevronDown size={10} className="opacity-40" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-[9px] font-black uppercase">Columnas</TooltipContent>
                </Tooltip>
                
                {showColumnSelector && (
                  <div className={cn(
                    "absolute bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-3 flex flex-col gap-3 animate-in fade-in zoom-in-95 z-[60] w-48",
                    isAnchored || isTopHeavy ? "top-full mt-2 left-0" : "bottom-full mb-2 left-0"
                  )}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 italic px-1">Diseño de Columnas</p>
                    <div className="flex items-center justify-between gap-2">
                      {[1, 2, 3].map(count => (
                        <button
                          key={count}
                          onClick={() => {
                            applyColumns(count);
                            setShowColumnSelector(false);
                          }}
                          className="flex-1 flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/5 border border-white/5 transition-all group"
                        >
                          <div className="w-full aspect-[3/4] bg-white/5 rounded border border-white/10 p-1 flex gap-0.5">
                            {Array.from({ length: count }).map((_, i) => (
                              <div key={i} className="h-full flex-1 bg-white/20 rounded-sm group-hover:bg-primary/40 transition-colors" />
                            ))}
                          </div>
                          <span className="text-[8px] font-black text-white/40 uppercase">{count} {count === 1 ? 'Col.' : 'Cols.'}</span>
                        </button>
                      ))}
                    </div>
                    <div className="h-px bg-white/5" />
                    <button className="text-[9px] font-black uppercase text-white/20 hover:text-white transition-colors text-left px-1 italic">Más opciones...</button>
                  </div>
                )}
              </div>
            </div>

            <div className={cn("flex items-center gap-0.5 pr-1 border-r border-white/5 mr-1 relative", isMoveMode && "pointer-events-none opacity-50")}>
              {showLinkInput ? (
                <div 
                  className={cn(
                    "absolute flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-2 py-1 shadow-2xl z-[70] animate-in fade-in zoom-in-95",
                    isAnchored || isTopHeavy ? "top-full mt-2 -left-12" : "bottom-full mb-2 -left-12"
                  )}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <input 
                    type="text" 
                    value={linkUrl} 
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyLink();
                      }
                      if (e.key === 'Escape') setShowLinkInput(false);
                    }}
                    placeholder="Escribe o pega la URL..."
                    className="bg-transparent border-none outline-none text-[10px] font-bold text-white/80 w-48 px-2 h-8"
                    autoFocus
                  />
                  <button onClick={applyLink} className="p-1.5 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors">
                    <Check size={12} />
                  </button>
                  <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={handleLinkButtonClick}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
                    >
                      <LinkIcon size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-[9px] font-black uppercase">Enlace</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className={cn("flex items-center gap-0.5", isMoveMode && "pointer-events-none opacity-50")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleCreateNote} className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-all animate-pulse"><StickyNote size={16} /></button>
                </TooltipTrigger>
                <TooltipContent className="bg-primary text-primary-foreground text-[9px] font-black uppercase">NOTAME (Anotación) [ALT+N]</TooltipContent>
              </Tooltip>
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => {
                        setShowColorSelector(!showColorSelector);
                        setShowBlockSelector(false);
                        setShowFontSelector(false);
                        setShowFontSizeSelector(false);
                        setShowAlignmentSelector(false);
                        setShowColumnSelector(false);
                        setShowLinkInput(false);
                      }} 
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        showColorSelector ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Palette size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-[9px] font-black uppercase">Color de texto</TooltipContent>
                </Tooltip>
                
                {showColorSelector && (
                  <div className={cn(
                    "absolute right-0 bg-[#111] border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 grid grid-cols-6 gap-3 animate-in fade-in zoom-in-95 z-[60] w-max",
                    isAnchored ? "top-full mt-3" : "bottom-full mb-3"
                  )}>
                    <p className="col-span-6 text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 italic px-1">COLORES FAVORITOS</p>
                    {paletteColors.map(color => (
                      <div key={color.value} className="relative group/color">
                        <button
                          onClick={() => {
                            execCommand('foreColor', color.value);
                            setShowColorSelector(false);
                          }}
                          className="w-10 h-10 rounded-xl border border-white/5 hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-primary/20"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setColorToDelete(color.value);
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-white opacity-0 group-hover/color:opacity-100 transition-opacity hover:scale-110 shadow-lg z-10"
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => colorInputRef.current?.click()}
                      className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shadow-lg"
                      title="Color personalizado"
                    >
                      <Plus size={20} />
                    </button>
                    <input 
                      type="color" 
                      ref={colorInputRef} 
                      className="hidden" 
                      onChange={(e) => {
                        const newColor = e.target.value;
                        execCommand('foreColor', newColor);
                        
                        // Añadir a favoritos si no existe
                        setPaletteColors(prev => {
                          if (prev.find(c => c.value.toLowerCase() === newColor.toLowerCase())) return prev;
                          return [...prev, { name: 'Personalizado', value: newColor }];
                        });
                        
                        setShowColorSelector(false);
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!colorToDelete} onOpenChange={(open) => !open && setColorToDelete(null)}>
        <AlertDialogContent className="bg-[#161616] border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black uppercase italic tracking-tighter">¿ELIMINAR COLOR?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-xs font-bold uppercase tracking-widest italic">
              Este color desaparecerá de tu paleta rápida. Podrás volver a añadirlo manualmente más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest italic">CANCELAR</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => colorToDelete && handleDeleteColor(colorToDelete)}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest italic"
            >
              ELIMINAR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default FloatingMenu;