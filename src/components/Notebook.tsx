"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Hash, X, CheckCircle2, ChevronDown, Trash2, Plus, GripVertical, MoreHorizontal, Palette, LayoutGrid, ArrowUp, ArrowDown, ArrowRight, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FloatingMenu from './FloatingMenu';
import TableToolbar from './TableToolbar';
import ImageToolbar from './ImageToolbar';
import ImageResizer from './ImageResizer';
import { cn } from '@/lib/utils';
import { BlockActionMenu } from './BlockActionMenu';
import { NotebookWidth } from '@/app/page';
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NotebookProps {
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontSize?: number;
  width?: NotebookWidth;
  isSpellcheckEnabled?: boolean;
  isShortcutMenuOnly?: boolean;
}

interface ResizeState {
  target: HTMLElement;
  direction: 'col' | 'row';
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

const rgb2hex = (rgb: string) => {
  if (!rgb) return "";
  if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;
  const rgbValues = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!rgbValues) return "";
  const hex = (x: string) => ("0" + parseInt(x).toString(16)).slice(-2);
  return "#" + hex(rgbValues[1]) + hex(rgbValues[2]) + hex(rgbValues[3]);
};

const HandleButton = ({ icon, label, onClick, className }: { icon: React.ReactNode, label: string, onClick: () => void, className?: string }) => (
  <button 
    onMouseDown={(e) => e.preventDefault()}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={cn("flex items-center gap-3 w-full px-2 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tight text-white/50 hover:bg-white/5 hover:text-white transition-all group", className)}
  >
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
      {icon}
    </div>
    <span>{label}</span>
  </button>
);

const Notebook = ({ 
  title, 
  setTitle, 
  content, 
  setContent, 
  tags, 
  setTags, 
  fontFamily = 'sans', 
  fontSize = 18, 
  width = 'wide',
  isSpellcheckEnabled = true,
  isShortcutMenuOnly = false
}: NotebookProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [showTableToolbar, setShowTableToolbar] = useState(false);
  const [showImageToolbar, setShowImageToolbar] = useState(false);
  const [activeTableCell, setActiveTableCell] = useState<HTMLTableCellElement | null>(null);
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isSaved, setIsSaved] = useState(true);
  const [isAnchored, setIsAnchored] = useState(false);
  const [pendingPaste, setPendingPaste] = useState<{ html: string; text: string; type: 'table' } | null>(null);
  const { toast } = useToast();
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mathBlockToEditRef = useRef<HTMLElement | null>(null);
  const [pendingMathEdit, setPendingMathEdit] = useState<string | null>(null);
  const [activeBlock, setActiveBlock] = useState({ label: 'Texto', icon: 'p' });
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false
  });

  const [isResizing, setIsResizing] = useState<ResizeState | null>(null);
  const [citationToDelete, setCitationToDelete] = useState<HTMLElement | null>(null);
  const [showCitationDialog, setShowCitationDialog] = useState(false);
  const [activeCitation, setActiveCitation] = useState<HTMLElement | null>(null);
  const [citationBtnPos, setCitationBtnPos] = useState({ top: 0, left: 0 });
  const [tableControls, setTableControls] = useState({
    show: false,
    tableTop: 0, tableLeft: 0, tableWidth: 0, tableHeight: 0,
    cellTop: 0, cellLeft: 0, cellWidth: 0, cellHeight: 0,
    showPlusRight: false, showPlusBottom: false
  });
  const [citationPresets, setCitationPresets] = useState<{ border: string, bg: string, dataBg: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luvia_citation_presets');
      if (saved) {
        try { return JSON.parse(saved); } catch(e) { return []; }
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('luvia_citation_presets', JSON.stringify(citationPresets));
    }
  }, [citationPresets]);

  const [hoveredBlock, setHoveredBlock] = useState<HTMLElement | null>(null);
  const [handleVisible, setHandleVisible] = useState(false);
  const [handlePos, setHandlePos] = useState({ top: 0, left: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const cell = target.closest('td, th') as HTMLElement;
    
    if (cell && (cell.hasAttribute('data-hover-edge') || cell.closest('.table-classic'))) {
      const edge = cell.getAttribute('data-hover-edge');
      const table = cell.closest('table');
      if (!table || !edge) return;

      e.preventDefault();
      e.stopPropagation();

      let resizeTarget = cell;
      
      // En table-layout: fixed, el ancho de la columna lo manda la primera fila.
      // Así que si redimensionamos columna, siempre apuntamos a la celda de la fila 0.
      if (edge === 'right') {
        const colIndex = Array.from(cell.parentElement?.children || []).indexOf(cell);
        const firstRowCell = table.querySelector('tr')?.children[colIndex] as HTMLElement;
        if (firstRowCell) resizeTarget = firstRowCell;
      }
      
      setIsResizing({
        target: resizeTarget,
        direction: edge === 'right' ? 'col' : 'row',
        startX: e.clientX,
        startY: e.clientY,
        startWidth: resizeTarget.offsetWidth,
        startHeight: resizeTarget.offsetHeight
      });
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      if (isResizing.direction === 'col') {
        const deltaX = e.clientX - isResizing.startX;
        const newWidth = Math.max(50, isResizing.startWidth + deltaX);
        const cell = isResizing.target as HTMLTableCellElement;
        const colIndex = cell.cellIndex;
        const table = cell.closest('table');
        if (table) {
          Array.from(table.rows).forEach(row => {
            const targetCell = row.cells[colIndex];
            if (targetCell) {
              targetCell.style.width = `${newWidth}px`;
              targetCell.style.minWidth = `${newWidth}px`;
            }
          });
        }
      } else {
        const deltaY = e.clientY - isResizing.startY;
        const newHeight = Math.max(25, isResizing.startHeight + deltaY);
        const cell = isResizing.target as HTMLTableCellElement;
        const row = cell.parentElement as HTMLTableRowElement;
        if (row) {
          Array.from(row.cells).forEach((c: any) => {
            c.style.height = `${newHeight}px`;
            c.style.minHeight = `${newHeight}px`;
          });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isResizing) {
        setIsResizing(null);
        if (editorRef.current) setContent(editorRef.current.innerHTML);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = isResizing.direction === 'col' ? 'col-resize' : 'row-resize';
    } else {
      document.body.style.cursor = '';
    }

    const handleSmartLink = (e: any) => {
      const text = e.detail;
      if (!text || text === 'selection_mode_start') return;
      if (editorRef.current) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        
        // This natively selects the text across spans/nodes if found
        if ((window as any).find(text, false, false, true, false, false, false)) {
          const range = selection?.getRangeAt(0);
          if (range) {
            const el = range.commonAncestorContainer.parentElement;
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.style.transition = 'background-color 0.5s';
              const oldBg = el.style.backgroundColor;
              el.style.backgroundColor = 'rgba(129, 140, 248, 0.4)'; // Highlight temporarily
              setTimeout(() => {
                el.style.backgroundColor = oldBg;
              }, 2000);
            }
          }
        } else {
          toast({ title: "No encontrado", description: "El texto referenciado ya no está en tus apuntes." });
        }
      }
    };
    
    window.addEventListener('luvia-smart-link', handleSmartLink);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        
        // Ensure editor is focused
        if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
          editorRef.current.focus();
        }

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Get position from caret or selection
          let rect = range.getBoundingClientRect();
          
          // If the rect is empty (sometimes happens with empty lines), try first client rect
          if (rect.width === 0 && rect.height === 0) {
            const rects = range.getClientRects();
            if (rects.length > 0) rect = rects[0];
          }

          // Final fallback if still empty
          if (rect.width === 0 && rect.height === 0 && editorRef.current) {
             rect = editorRef.current.getBoundingClientRect();
          }

          setMenuPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
          setShowFloatingMenu(true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('luvia-smart-link', handleSmartLink);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isResizing, setContent, toast]);

  const removeCitation = (type: 'only-cita' | 'cita-and-text') => {
    if (!citationToDelete) return;

    if (type === 'only-cita') {
      const text = citationToDelete.innerText;
      const p = document.createElement('p');
      p.innerText = text;
      citationToDelete.replaceWith(p);
    } else {
      citationToDelete.remove();
    }

    if (editorRef.current) setContent(editorRef.current.innerHTML);
    setShowCitationDialog(false);
    setCitationToDelete(null);
  };

  const handleInsertMathComplete = (newNode: HTMLElement | null) => {
    if (mathBlockToEditRef.current && newNode) {
      mathBlockToEditRef.current.replaceWith(newNode);
    } else if (newNode) {
      // New math block - insert at cursor
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(newNode);
        
        // Move cursor after
        const newRange = document.createRange();
        newRange.setStartAfter(newNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
    mathBlockToEditRef.current = null;
    setPendingMathEdit(null);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const stats = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const readTime = Math.ceil(words / 200); 
    return { words, readTime };
  }, [content]);

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Handle Math block clicks
    const mathBlock = target.closest('.luvia-math') as HTMLElement;
    if (mathBlock) {
      const isDelete = target.closest('.math-delete-btn');
      const isEdit = target.closest('.math-edit-btn');
      
      if (isDelete) {
        e.preventDefault();
        e.stopPropagation();
        mathBlock.remove();
        if (editorRef.current) setContent(editorRef.current.innerHTML);
        toast({ title: "Ecuación eliminada" });
        return;
      }
      
      // If clicking edit button, the formula itself, or the render wrapper
      if (isEdit || target.closest('.math-render') || !target.closest('.math-controls')) {
        e.preventDefault();
        e.stopPropagation();
        const latex = mathBlock.getAttribute('data-latex') || '';
        mathBlockToEditRef.current = mathBlock;
        setPendingMathEdit(latex);
        
        // REPOSITION MENU: Make it pop up right where the equation is
        const rect = mathBlock.getBoundingClientRect();
        setMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
        
        setShowFloatingMenu(true);
        return;
      }
    }

    const bq = target.closest('blockquote') as HTMLElement;
    
    // 1. Citation bar click detection
    if (bq && editorRef.current?.contains(bq)) {
      const rect = bq.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      
      // If clicked on the left part (the bar area)
      if (clickX < 60) {
        setCitationBtnPos({
          top: rect.top - (editorRef.current.parentElement?.getBoundingClientRect().top || 0),
          left: rect.left - (editorRef.current.parentElement?.getBoundingClientRect().left || 0)
        });
        setActiveCitation(bq);
        return;
      }
    }
    
    if (!target.closest('.citation-delete-btn')) {
      setActiveCitation(null);
    }

    // 2. Clear image highlight
    editorRef.current?.querySelectorAll('img').forEach(img => img.classList.remove('active-image'));

    // 3. Image click detection
    const img = target.closest('img');
    if (img && editorRef.current?.contains(img)) {
      const rect = img.getBoundingClientRect();
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      img.classList.add('active-image');
      setActiveImage(img);
      setShowImageToolbar(true);
      setShowFloatingMenu(false);
      setShowTableToolbar(false);
      setActiveTableCell(null);
      return;
    }

    setActiveImage(null);
    setShowImageToolbar(false);

    // 4. Link click handling
    const link = target.closest('a');
    if (link) {
      e.preventDefault();
      const url = link.getAttribute('href');
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // 5. Notita click handling
    const highlight = target.closest('.notame-highlight') as HTMLElement | null;
    if (highlight && !isAnchored) {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
      const rect = highlight.getBoundingClientRect();
      setMenuPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      setShowFloatingMenu(true);
    }
  };

  const scheduleMenuHide = () => {
    if (isAnchored) return;
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    menuTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      const hasText = selection && selection.toString().trim().length > 0;
      const isHoveringMenu = document.querySelector('.floating-menu-container:hover');
      const isMenuFocused = document.activeElement?.closest('.floating-menu-container');
      const isMathModalOpen = !!document.getElementById('math-modal-container');
      const isEditingMath = !!pendingMathEdit;
      
      // If we have text, or we are interacting with the menu/modal/editing math, don't hide
      if (hasText || isHoveringMenu || isMenuFocused || isMathModalOpen || isEditingMath) return;
      
      setShowFloatingMenu(false);
    }, 500); // Increased timeout to 500ms
  };

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === 3 ? container.parentElement : (container as HTMLElement);
    
    if (!editorRef.current?.contains(container) || !element) return;

    // Detect block type for "Turn In" live updates
    const parentBlock = element.closest('p, h1, h2, h3, ul, ol, li, blockquote, table, hr, .todo-item-container');
    if (parentBlock) {
      const tag = parentBlock.tagName.toLowerCase();
      const isTodo = parentBlock.classList.contains('todo-item-container');
      let blockLabel = 'Texto';
      
      if (isTodo) blockLabel = 'To-do';
      else if (tag === 'h1') blockLabel = 'Título 1';
      else if (tag === 'h2' || tag === 'h3') blockLabel = 'Subtítulo';
      else if (tag === 'ul' || (tag === 'li' && parentBlock.parentElement?.tagName === 'UL')) blockLabel = 'Lista';
      else if (tag === 'ol' || (tag === 'li' && parentBlock.parentElement?.tagName === 'OL')) blockLabel = 'Lista Numerada';
      else if (tag === 'blockquote') blockLabel = 'Cita';
      else if (tag === 'table') blockLabel = 'Tabla';
      else if (tag === 'hr') blockLabel = 'Divisor';
      
      setActiveBlock({ label: blockLabel, icon: tag });
    } else {
      setActiveBlock({ label: 'Texto', icon: 'p' });
    }

    // Detect text styles
    setActiveStyles({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
      alignLeft: document.queryCommandState('justifyLeft'),
      alignCenter: document.queryCommandState('justifyCenter'),
      alignRight: document.queryCommandState('justifyRight'),
      alignJustify: document.queryCommandState('justifyFull'),
    });

    const hasTextSelection = selection.toString().trim().length > 0;
    const tableCell = element.closest('td, th') as HTMLTableCellElement | null;
    
    if (hasTextSelection && !isAnchored && !isShortcutMenuOnly) {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
      
      // Fix: Get rect from getClientRects to snap to the FIRST line of selection
      // This prevents the menu from hiding in corners when multi-line is selected
      const rects = range.getClientRects();
      const firstLineRect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
      
      const calcX = firstLineRect.left + firstLineRect.width / 2;

      setMenuPosition({
        x: calcX,
        y: firstLineRect.top - 10
      });
      setShowFloatingMenu(true);
      setShowTableToolbar(false);
      setShowImageToolbar(false);
      setActiveTableCell(null);
      setActiveImage(null);
      return;
    } 

    if (tableCell && editorRef.current?.contains(tableCell)) {
      const cellRect = tableCell.getBoundingClientRect();
      const table = tableCell.closest('table') as HTMLTableElement;
      const tableRect = table.getBoundingClientRect();
      const editorRect = editorRef.current.parentElement?.getBoundingClientRect() || { top: 0, left: 0 };
      
      const isLastCol = tableCell.cellIndex === tableCell.parentElement?.children.length ? tableCell.parentElement?.children.length - 1 : 0;
      const isLastRow = (tableCell.parentElement as HTMLTableRowElement)?.rowIndex === table.rows.length - 1;

      setTableControls({
        show: true,
        tableWidth: tableRect.width,
        tableHeight: tableRect.height,
        tableTop: tableRect.top - editorRect.top,
        tableLeft: tableRect.left - editorRect.left,
        cellTop: cellRect.top - editorRect.top,
        cellLeft: cellRect.left - editorRect.left,
        cellWidth: cellRect.width,
        cellHeight: cellRect.height,
        showPlusRight: tableCell.cellIndex === table.rows[0].cells.length - 1,
        showPlusBottom: (tableCell.parentElement as HTMLTableRowElement)?.rowIndex === table.rows.length - 1
      });

      setMenuPosition({ x: cellRect.left + cellRect.width / 2, y: cellRect.top });
      setActiveTableCell(tableCell);
      setShowTableToolbar(true);
      setShowFloatingMenu(false);
      setShowImageToolbar(false);
      setActiveImage(null);
    } else {
      setTableControls(prev => ({ ...prev, show: false }));
      scheduleMenuHide();
      setShowTableToolbar(false);
      setActiveTableCell(null);
    }
  }, [isAnchored, isShortcutMenuOnly, pendingMathEdit]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    };
  }, [handleSelectionChange]);

  useEffect(() => {
    const handleSmartLink = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail || !editorRef.current) return;
      
      let targetEl: HTMLElement | null = null;

      // Try searching by marker ID first
      if (typeof detail === 'string' && detail.startsWith('reminder-')) {
        targetEl = editorRef.current.querySelector(`[data-reminder-id="${detail}"]`) as HTMLElement;
      }

      // Fallback to text content search
      if (!targetEl) {
        const elements = Array.from(editorRef.current.querySelectorAll('p, h1, h2, h3, li, blockquote, td, span, mark'));
        targetEl = elements.find(el => (el as HTMLElement).textContent?.includes(detail)) as HTMLElement;
      }
      
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const originalBg = targetEl.style.backgroundColor;
        const originalOutline = targetEl.style.outline;
        targetEl.style.transition = 'all 0.5s';
        targetEl.style.outline = '4px solid hsl(var(--primary))';
        targetEl.style.outlineOffset = '2px';
        setTimeout(() => {
          if (targetEl) {
            targetEl.style.outline = originalOutline;
          }
        }, 2500);
      }
    };
    
    window.addEventListener('luvia-smart-link', handleSmartLink);

    const handleRemoveReminder = (e: any) => {
      const markerId = e.detail;
      if (!markerId) return;
      const marker = editorRef.current?.querySelector(`[data-reminder-id="${markerId}"]`);
      if (marker) {
        const text = marker.textContent || "";
        marker.replaceWith(text);
        if (editorRef.current) setContent(editorRef.current.innerHTML);
      }
    };
    window.addEventListener('luvia-remove-reminder', handleRemoveReminder);

    const handleEditorDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const reminder = target.closest('.luvia-reminder-mark') as HTMLElement;
      if (reminder) {
        const markerId = reminder.getAttribute('data-reminder-id');
        if (markerId) {
          window.dispatchEvent(new CustomEvent('luvia-open-reminder-manager', { detail: markerId }));
        }
      }
    };
    editorRef.current?.addEventListener('dblclick', handleEditorDoubleClick);

    return () => {
      window.removeEventListener('luvia-smart-link', handleSmartLink);
      window.removeEventListener('luvia-remove-reminder', handleRemoveReminder);
      editorRef.current?.removeEventListener('dblclick', handleEditorDoubleClick);
    };
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.innerHTML);
    setIsSaved(false);
    setTimeout(() => setIsSaved(true), 1500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing) return;
    const target = e.target as HTMLElement;
    const cell = target.closest('td, th') as HTMLElement;
    const table = cell?.closest('table');

    editorRef.current?.querySelectorAll('[data-hover-edge]').forEach(el => {
      el.removeAttribute('data-hover-edge');
    });

    if (cell && table && table.classList.contains('table-classic')) {
      const rect = cell.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const threshold = 15;
      if (x > rect.width - threshold) {
        const colIndex = Array.from(cell.parentElement?.children || []).indexOf(cell);
        table.querySelectorAll('tr').forEach(tr => {
          const rowCell = tr.children[colIndex] as HTMLElement;
          if (rowCell) rowCell.setAttribute('data-hover-edge', 'right');
        });
      } else if (y > rect.height - threshold) {
        const tr = cell.parentElement;
        if (tr) {
          Array.from(tr.children).forEach(rowCell => {
            (rowCell as HTMLElement).setAttribute('data-hover-edge', 'bottom');
          });
        }
      }
    }

    // --- Block Handle Detection ---
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      
      // If mouse is within the editor or its left margin
      if (e.clientX >= rect.left - 150 && e.clientX <= rect.right) {
        // Prefer LI if we are inside a list, otherwise top-level block
        let block = target.closest('li') as HTMLElement;
        if (!block || !editorRef.current.contains(block)) {
          block = target.closest('.editor-content > *') as HTMLElement;
        }
        
        // If we are hovering over the editor but not directly over a child, find the closest child
        if (!block && (target.classList.contains('editor-content') || editorRef.current.contains(target))) {
           const y = e.clientY;
           const children = Array.from(editorRef.current.children);
           block = children.find(child => {
             const r = child.getBoundingClientRect();
             return y >= r.top && y <= r.bottom;
           }) as HTMLElement;
        }

        if (block && editorRef.current.contains(block) && !block.classList.contains('block-handle-container')) {
          const blockRect = block.getBoundingClientRect();
          const editorContainerRect = editorRef.current.parentElement?.getBoundingClientRect();
          
          if (editorContainerRect) {
            setHoveredBlock(block);
            setHandlePos({
              top: blockRect.top - editorContainerRect.top,
              left: (blockRect.left - editorContainerRect.left) - 35
            });
            setHandleVisible(true);
          }
        }
      } else {
        const handleContainer = document.querySelector('.block-handle-container');
        if (!handleContainer?.contains(e.target as Node)) {
          setHandleVisible(false);
        }
      }
    }

    if (isAnchored) return;
    const menuContainer = target.closest('.floating-menu-container');
    const isNoteActive = document.querySelector('.notame-editor-active');

    if (menuContainer || isNoteActive) {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    } else {
      const selection = window.getSelection();
      const hasText = selection && selection.toString().trim().length > 0;
      if (!hasText) {
        scheduleMenuHide();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let foundImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageDataUrl = event.target?.result as string;
            const imgHtml = `<img src="${imageDataUrl}" style="width: 100%; display: block; margin: 1.5rem auto;" class="h-auto rounded-2xl border-4 border-white/5 shadow-2xl transition-all duration-300" /><p><br></p>`;
            document.execCommand('insertHTML', false, imgHtml);
            if (editorRef.current) setContent(editorRef.current.innerHTML);
          };
          reader.readAsDataURL(file);
          foundImage = true;
        }
      }
    }

    if (!foundImage) {
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');

      // Detect if it's a table
      const hasTableHtml = html && (html.toLowerCase().includes('<table') || html.toLowerCase().includes('<tr') || html.toLowerCase().includes('<td'));
      // Reliably detect table data: Tabs or multiple spaces with newlines
      const looksLikeTable = text && text.trim().includes('\n') && (text.includes('\t') || text.includes('    ') || text.includes('  '));

      if (hasTableHtml || looksLikeTable) {
        e.preventDefault();
        setPendingPaste({ html, text, type: 'table' });
      } else {
        // Normal paste
        e.preventDefault();
        
        let contentToInsert = html || text;
        
        // Detect LaTeX patterns and convert to Luvia Math blocks
        if (text && (text.includes('$$') || text.includes('\\frac') || text.includes('\\sum') || text.includes('\\int') || text.includes('\\infty') || /\$[^$\n]+\$/.test(text))) {
           let processedText = text;
           // Block math: $$ ... $$
           processedText = processedText.replace(/\$\$(.*?)\$\$/gs, (match, latex) => {
             try {
               const cleanLatex = latex.trim();
               const mathHtml = (window as any).katex.renderToString(cleanLatex, { displayMode: true, throwOnError: false });
               return `<span class="luvia-math group/math relative inline-block transition-all cursor-pointer border border-transparent hover:border-primary/20 rounded px-1 mx-0.5" contenteditable="false" data-latex="${cleanLatex.replace(/"/g, '&quot;')}">
                 <span class="math-render">${mathHtml}</span>
                 <span class="math-controls absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/math:opacity-100 flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-1.5 shadow-2xl transition-opacity z-[100] pointer-events-auto">
                   <button class="math-edit-btn p-1 hover:bg-primary/20 rounded text-primary/60 hover:text-primary transition-colors">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                   </button>
                   <button class="math-delete-btn p-1 hover:bg-red-500/20 rounded text-red-500/60 hover:text-red-500 transition-colors">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                   </button>
                 </span>
               </span>`;
             } catch (err) {
               return match;
             }
           });
           
           // Inline math: $ ... $ (avoiding single $ signs in text)
           processedText = processedText.replace(/\$([^\$\n]+?)\$/g, (match, latex) => {
             if (latex.length < 1) return match;
             try {
               const cleanLatex = latex.trim();
               const mathHtml = (window as any).katex.renderToString(cleanLatex, { displayMode: false, throwOnError: false });
               return `<span class="luvia-math group/math relative inline-block transition-all cursor-pointer border border-transparent hover:border-primary/20 rounded px-1 mx-0.5" contenteditable="false" data-latex="${cleanLatex.replace(/"/g, '&quot;')}">
                 <span class="math-render">${mathHtml}</span>
                 <span class="math-controls absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/math:opacity-100 flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-1.5 shadow-2xl transition-opacity z-[100] pointer-events-auto">
                   <button class="math-edit-btn p-1 hover:bg-primary/20 rounded text-primary/60 hover:text-primary transition-colors">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                   </button>
                   <button class="math-delete-btn p-1 hover:bg-red-500/20 rounded text-red-500/60 hover:text-red-500 transition-colors">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                   </button>
                 </span>
               </span>`;
             } catch (err) {
               return match;
             }
           });

           document.execCommand('insertHTML', false, processedText.replace(/\n/g, '<br>'));
        } else {
          if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            doc.querySelectorAll('*').forEach(el => {
              const element = el as HTMLElement;
              if (element.style) {
                element.style.fontSize = '';
                element.style.fontFamily = '';
                element.style.lineHeight = '';
              }
            });
            document.execCommand('insertHTML', false, doc.body.innerHTML);
          }
          else if (text) document.execCommand('insertText', false, text);
        }
        
        if (editorRef.current) setContent(editorRef.current.innerHTML);
      }
    }
  };

  const processPendingPaste = (style: 'classic' | 'cards' | 'text') => {
    if (!pendingPaste) return;

    if (style === 'classic' || style === 'cards') {
      const isCards = style === 'cards';
      const tableClass = isCards ? 'table-cards' : 'table-classic';
      
      let tableHtml = '';

      if (pendingPaste.html && /<table/i.test(pendingPaste.html)) {
        // Already has table HTML, we need to inject our class
        const parser = new DOMParser();
        const doc = parser.parseFromString(pendingPaste.html, 'text/html');
        const tables = doc.querySelectorAll('table');
        tables.forEach(table => {
          table.classList.remove('table-classic', 'table-cards');
          table.classList.add(tableClass, 'w-full', 'border-collapse', 'my-4');
          table.removeAttribute('style');
          table.setAttribute('border', '1'); // For accessibility/raw support although CSS handles it

          // Ensure cells have reasonable content if empty and STRIP STYLES
          table.querySelectorAll('td, th').forEach(cell => {
            cell.removeAttribute('style'); // CRITICAL: remove inline styles that might hide borders
            cell.classList.add('p-4', 'border', 'border-white/20'); // Force extra visibility classes
            if (!cell.innerHTML.trim()) cell.innerHTML = '<br>';
          });
        });
        tableHtml = doc.body.innerHTML;
      } else if (pendingPaste.text) {
        // Convert plain text tabular data to table
        const lines = pendingPaste.text.split(/\r?\n/).filter(line => line.trim().length > 0);
        const tableRows = lines.map(line => {
          // Split by tabs or 2+ spaces
          const cells = line.split(/\t|\s{2,}/).filter(c => c.trim().length > 0);
          return `<tr>${cells.map(cell => `<td>${cell.trim() || '<br>'}</td>`).join('')}</tr>`;
        }).join('');
        
        tableHtml = `
          <table class="${tableClass} w-full border-collapse my-4">
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <p><br></p>
        `;
      }

      if (tableHtml) {
        document.execCommand('insertHTML', false, tableHtml);
        toast({ 
          title: `TABLA ${isCards ? 'MODERNA' : 'CLÁSICA'} GENERADA`, 
          description: "La estructura se ha adaptado al diseño de la aplicación." 
        });
      }
    } else {
      // Paste as normal text
      if (pendingPaste.text) document.execCommand('insertText', false, pendingPaste.text);
      else if (pendingPaste.html) document.execCommand('insertHTML', false, pendingPaste.html);
    }

    if (editorRef.current) setContent(editorRef.current.innerHTML);
    setPendingPaste(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle specific list deletions to keep text in same position (not merging with above line)
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        
        // Logic for deleting luvia-math blocks
        const container = range.startContainer;
        const offset = range.startOffset;

        // Check if cursor is at the very beginning of a block
        if (offset === 0) {
          const block = container.nodeType === 3 ? container.parentElement : (container as HTMLElement);
          const currentBlock = block?.closest('p, h1, h2, h3, li, blockquote');
          
          if (currentBlock) {
            const prev = currentBlock.previousElementSibling as HTMLElement;
            if (prev && prev.classList?.contains('luvia-math')) {
              e.preventDefault();
              prev.remove();
              if (editorRef.current) setContent(editorRef.current.innerHTML);
              return;
            }
          }
        }
        
        // Check children if cursor is in an element node
        if (container.nodeType === 1) {
          const prevNode = container.childNodes[offset - 1] as HTMLElement;
          if (prevNode && prevNode.classList?.contains('luvia-math')) {
            e.preventDefault();
            prevNode.remove();
            if (editorRef.current) setContent(editorRef.current.innerHTML);
            return;
          }
        }

        // If we are IN a text node, check if it's the first child and its previous sibling is math
        if (container.nodeType === 3 && offset === 0) {
           const prev = container.previousSibling as HTMLElement;
           if (prev && prev.classList?.contains('luvia-math')) {
             e.preventDefault();
             prev.remove();
             if (editorRef.current) setContent(editorRef.current.innerHTML);
             return;
           }
        }

        const li = range.startContainer.nodeType === 3 
          ? range.startContainer.parentElement?.closest('li') 
          : (range.startContainer as HTMLElement).closest('li');

        if (li && range.startOffset === 0) {
          // At the start of a list item
          e.preventDefault();
          
          const content = li.innerHTML;
          const parent = li.parentElement;
          
          if (parent) {
             const p = document.createElement('p');
             p.innerHTML = content || '<br>';
             
             // If we have bullet points above, we need to split the UL
             const previousLi = li.previousElementSibling;
             const nextLi = li.nextElementSibling;
             
             if (!previousLi && !nextLi) {
               // Only item in list
               parent.replaceWith(p);
             } else if (!previousLi) {
               // First item
               parent.insertBefore(p, parent.firstChild);
               li.remove();
             } else {
               // Has items above, insert after the list or split it (simpler to just pull out)
               const newUl = document.createElement(parent.tagName);
               let current = li.nextElementSibling;
               while (current) {
                 const next = current.nextElementSibling;
                 newUl.appendChild(current);
                 current = next;
               }
               
               parent.after(p);
               if (newUl.children.length > 0) {
                 p.after(newUl);
               }
               li.remove();
             }
             
             // Set cursor back
             const newRange = document.createRange();
             newRange.selectNodeContents(p);
             newRange.collapse(true);
             selection.removeAllRanges();
             selection.addRange(newRange);
             
             if (editorRef.current) setContent(editorRef.current.innerHTML);
          }
        }
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      const currentClean = editorRef.current.innerHTML.replace(/\s*active-image/g, '');
      const contentClean = content.replace(/\s*active-image/g, '');
      if (currentClean !== contentClean) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  const fontClass = useMemo(() => {
    switch (fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-code';
      default: return 'font-body';
    }
  }, [fontFamily]);

  const widthClass = useMemo(() => {
    switch (width) {
      case 'standard': return 'max-w-4xl';
      case 'wide': return 'max-w-6xl';
      case 'full': return 'max-w-none';
      default: return 'max-w-5xl';
    }
  }, [width]);

  const handleContainerClick = (e: React.MouseEvent) => {
    // Single click: focus at the end if clicking empty container space
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('group/notebook')) {
      editorRef.current?.focus({ preventScroll: true });
      
      const selection = window.getSelection();
      if (selection && editorRef.current) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false); // Move to end of everything
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handleContainerDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('group/notebook')) {
      editorRef.current?.focus({ preventScroll: true });
      const selection = window.getSelection();
      if (selection && editorRef.current) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        editorRef.current.scrollIntoView({ block: 'end', behavior: 'instant' });
      }
    }
  };

  const handleMarginDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const marginSize = 48; // px-12 => 3rem => 48px
    const scrollContainer = document.querySelector('.notebook-scroll-area');

    if (x < marginSize) {
      e.stopPropagation();
      // Left margin -> Scroll to Top
      if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      toast({ title: "Navegación", description: "Volviendo al inicio" });
    } else if (x > rect.width - marginSize) {
      e.stopPropagation();
      // Right margin -> Scroll to Bottom
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
      toast({ title: "Navegación", description: "Yendo al final" });
    }
  };

  const deleteActiveBlock = () => {
    if (hoveredBlock) {
      hoveredBlock.remove();
      setHandleVisible(false);
      setHoveredBlock(null);
      if (editorRef.current) setContent(editorRef.current.innerHTML);
      toast({ title: "Bloque eliminado" });
    }
  };

  const duplicateActiveBlock = () => {
    if (hoveredBlock) {
      const clone = hoveredBlock.cloneNode(true) as HTMLElement;
      // Ensure unique IDs if needed, but here we'll just insert
      hoveredBlock.insertAdjacentElement('afterend', clone);
      if (editorRef.current) setContent(editorRef.current.innerHTML);
      toast({ title: "Bloque duplicado" });
    }
  };

  const copyActiveBlock = () => {
    if (hoveredBlock) {
      navigator.clipboard.writeText(hoveredBlock.innerText);
      toast({ title: "Copiado al portapapeles" });
    }
  };

  const turnActiveBlockInto = (tag: string) => {
    if (hoveredBlock) {
       if (tag === 'ul') {
          hoveredBlock.focus();
          document.execCommand('insertUnorderedList');
       } else if (tag === 'ol') {
          hoveredBlock.focus();
          document.execCommand('insertOrderedList');
       } else if (tag === 'todo') {
          const selectionText = hoveredBlock.innerText.trim();
          const todoHtml = `<div class="todo-item-container" style="display: flex; align-items: flex-start; gap: 0.75rem; margin: 0.5rem 0; width: 100%;"><div contenteditable="false" style="display: flex; align-items: center; padding-top: 0.2rem; user-select: none;"><input type="checkbox" style="appearance: none; -webkit-appearance: none; width: 1.15rem; height: 1.15rem; border: 2.5px solid hsl(var(--primary)); border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: transparent;" /></div><div contenteditable="true" style="flex: 1; outline: none; border: none; padding: 0; margin: 0; min-height: 1.2rem; color: inherit;">${selectionText || 'Nueva nota'}</div></div><p><br></p>`;
          hoveredBlock.outerHTML = todoHtml;
       } else {
          const newEl = document.createElement(tag);
          newEl.innerHTML = hoveredBlock.innerHTML;
          newEl.className = hoveredBlock.className;
          hoveredBlock.replaceWith(newEl);
       }
       
       if (editorRef.current) setContent(editorRef.current.innerHTML);
       setHandleVisible(false);
       toast({ title: `Convertido a ${tag.toUpperCase()}` });
    }
  };

  const colorActiveBlock = (color: string) => {
    if (hoveredBlock) {
      if (hoveredBlock.tagName === 'LI') {
        const span = hoveredBlock.querySelector('span:not(.notame-highlight)') as HTMLElement;
        if (span) span.style.color = color;
        else hoveredBlock.style.color = color;
      } else {
        hoveredBlock.style.color = color;
      }
      
      // If it's inherit, remove style
      if (color === 'inherit') {
        hoveredBlock.style.removeProperty('color');
      }

      if (editorRef.current) setContent(editorRef.current.innerHTML);
      toast({ title: "Color aplicado" });
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent selection:bg-primary/30" onMouseMove={handleMouseMove}>
      {isAnchored && (
        <div className="sticky top-0 z-[40] w-full bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 h-12 flex items-center animate-in slide-in-from-top duration-300">
          <FloatingMenu 
            position={{ x: 0, y: 0 }} 
            onClose={() => {}}
            editorRef={editorRef}
            setContent={setContent}
            activeBlock={activeBlock}
            setActiveBlock={setActiveBlock}
            activeStyles={activeStyles}
            isAnchored={true}
            onToggleAnchor={() => setIsAnchored(!isAnchored)}
            isShortcutMenuOnly={isShortcutMenuOnly}
            pendingMathEdit={pendingMathEdit}
            onInsertMathComplete={handleInsertMathComplete}
          />
        </div>
      )}

      <div className="relative notebook-scroll-area overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar" onClick={handleContainerClick} onDoubleClick={handleContainerDoubleClick}>
        <div 
          className={cn(
            "mx-auto pt-8 pb-96 px-12 group/notebook relative text-left transition-all duration-500 min-h-[calc(100vh-200px)]",
            widthClass,
            isSpellcheckEnabled ? "spellcheck-true" : "spellcheck-false"
          )}
          spellCheck={isSpellcheckEnabled}
          onDoubleClick={handleMarginDoubleClick}
        >
          {showFloatingMenu && !isAnchored && (
            <FloatingMenu 
              position={menuPosition} 
              onClose={() => setShowFloatingMenu(false)} 
              editorRef={editorRef}
              setContent={setContent}
              activeBlock={activeBlock}
              setActiveBlock={setActiveBlock}
              activeStyles={activeStyles}
              isAnchored={false}
              onToggleAnchor={() => setIsAnchored(true)}
              isShortcutMenuOnly={isShortcutMenuOnly}
              pendingMathEdit={pendingMathEdit}
              onInsertMathComplete={handleInsertMathComplete}
            />
          )}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="flex items-center gap-1.5 bg-white/5 text-muted-foreground border border-white/5 px-2.5 py-1 rounded-lg text-[12px] group/tag hover:bg-white/10 transition-all"
                >
                  <Hash size={12} className="opacity-40" />
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 opacity-0 group-hover/tag:opacity-100 hover:text-destructive transition-all">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="relative block-handles-zone">
            <div 
              className={cn("block-handle-container", handleVisible && "visible")}
              style={{ top: handlePos.top, left: handlePos.left }}
              onMouseEnter={() => setHandleVisible(true)}
              onMouseLeave={() => setHandleVisible(false)}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="block-handle-grip"
                    draggable
                    onDragStart={(e) => {
                      if (hoveredBlock) {
                        e.dataTransfer.setData('text/plain', hoveredBlock.id);
                        hoveredBlock.classList.add('opacity-50');
                      }
                    }}
                    onDragEnd={() => {
                      if (hoveredBlock) hoveredBlock.classList.remove('opacity-50');
                    }}
                  >
                    <GripVertical size={16} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="p-0 border-none bg-transparent shadow-none" sideOffset={10}>
                  <BlockActionMenu 
                    onDelete={deleteActiveBlock}
                    onDuplicate={duplicateActiveBlock}
                    onCopy={copyActiveBlock}
                    onTurnInto={turnActiveBlockInto}
                    onColor={colorActiveBlock}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onClick={handleEditorClick}
              onDoubleClick={handleEditorClick}
              onPaste={handlePaste}
              onKeyUp={(e) => {
                if (e.key === '$' || e.key === 'Enter') {
                  const selection = window.getSelection();
                  if (!selection?.rangeCount) return;
                  const range = selection.getRangeAt(0);
                  const node = range.startContainer;
                  
                  // We only auto-transform in text nodes
                  if (node.nodeType !== Node.TEXT_NODE) return;
                  
                  const text = node.textContent || '';
                  const pos = range.startOffset;
                  const beforeCursor = text.substring(0, pos);
                  
                  // Pattern: \command{...}$$ or \command$$ or even just \command 
                  // But we use $$ as the "seal" to transform
                  const match = beforeCursor.match(/(\\[a-zA-Z]+(?:\{[^{}]*\}|[^{}\$])*)\$\$$/);
                  
                  if (match) {
                    const latex = match[1];
                    const fullMatch = match[0];
                    
                    // Select the raw text to replace
                    range.setStart(node, pos - fullMatch.length);
                    range.setEnd(node, pos);
                    range.deleteContents();
                    
                    const mathSpan = document.createElement('span');
                    mathSpan.className = 'luvia-math inline-flex items-center group relative mx-1';
                    mathSpan.contentEditable = 'false';
                    mathSpan.setAttribute('data-latex', latex);
                    mathSpan.innerHTML = `
                      <span class="math-render"></span>
                      <div class="math-controls absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0d0d0f] border border-white/10 rounded-lg px-2 py-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-50">
                        <button class="math-edit-btn p-1 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors" title="Editar"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                        <button class="math-delete-btn p-1 hover:bg-destructive/20 rounded text-white/40 hover:text-destructive transition-colors" title="Eliminar"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                      </div>
                    `;
                    
                    range.insertNode(mathSpan);
                    const renderTarget = mathSpan.querySelector('.math-render') as HTMLElement;
                    if (renderTarget && (window as any).katex) {
                      try {
                        (window as any).katex.render(latex, renderTarget, { throwOnError: false, displayMode: false });
                      } catch (err) {
                        console.error("Katex error:", err);
                      }
                    }
                    
                    // Move cursor after
                    const newRange = document.createRange();
                    newRange.setStartAfter(mathSpan);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                  }
                }
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleSelectionChange}
              onKeyDown={(e) => {
                handleKeyDown(e);
                if (e.defaultPrevented) return;

                // Check custom block shortcuts first
                try {
                  const rawShortcuts = localStorage.getItem('blockShortcuts');
                  if (rawShortcuts) {
                    const blockShortcuts = JSON.parse(rawShortcuts);
                    const parts = [];
                    if (e.ctrlKey) parts.push('ctrl');
                    if (e.metaKey) parts.push('cmd');
                    if (e.altKey) parts.push('alt');
                    if (e.shiftKey) parts.push('shift');
                    
                    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
                      parts.push(e.key.toLowerCase());
                      const combo = parts.join('+');
                      
                      const matchedLabel = Object.keys(blockShortcuts).find(k => blockShortcuts[k] === combo);
                      if (matchedLabel) {
                        e.preventDefault();
                        
                        const tagMap: Record<string, string> = {
                          'Texto': 'P', 'Título 1': 'H1', 'Subtítulo': 'H2', 'Cita': 'BLOCKQUOTE'
                        };
                        
                        if (matchedLabel === 'Lista') {
                          document.execCommand('insertUnorderedList');
                        } else if (matchedLabel === 'Lista Numerada') {
                          document.execCommand('insertOrderedList');
                        } else if (tagMap[matchedLabel]) {
                          try {
                            document.execCommand('formatBlock', false, tagMap[matchedLabel]);
                          } catch (err) {
                            document.execCommand('formatBlock', false, `<${tagMap[matchedLabel]}>`);
                          }
                        } else if (matchedLabel === 'Divisor') {
                          document.execCommand('insertHorizontalRule');
                        } else if (matchedLabel === 'To-do') {
                          const selectionText = window.getSelection()?.toString().trim();
                          const todoHtml = `<div class="todo-item-container" style="display: flex; align-items: flex-start; gap: 0.75rem; margin: 0.5rem 0; width: 100%;"><div contenteditable="false" style="display: flex; align-items: center; padding-top: 0.2rem; user-select: none;"><input type="checkbox" onchange="const p=this.parentElement.nextElementSibling;if(this.checked){p.style.textDecoration='line-through';p.style.opacity='0.4';this.style.background='hsl(var(--primary))';this.style.backgroundImage='url(&quot;data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%224%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%2220 6 9 17 4 12%22%3E%3C/polyline%3E%3C/svg%3E&quot;)';this.style.backgroundSize='80%';this.style.backgroundRepeat='no-repeat';this.style.backgroundPosition='center';}else{p.style.textDecoration='none';p.style.opacity='1';this.style.background='transparent';this.style.backgroundImage='none';}" style="appearance: none; -webkit-appearance: none; width: 1.15rem; height: 1.15rem; border: 2.5px solid hsl(var(--primary)); border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: transparent;" /></div><div contenteditable="true" style="flex: 1; outline: none; border: none; padding: 0; margin: 0; min-height: 1.2rem; color: inherit;">${selectionText || 'Nueva nota'}</div></div><p><br></p>`;
                          document.execCommand('insertHTML', false, todoHtml);
                        } else if (matchedLabel === 'Toggle') {
                          const selectionText = window.getSelection()?.toString().trim();
                          const toggleHtml = `<div class="toggle-container group" data-state="open" style="margin: 0.5rem 0; width: 100%;"><div class="toggle-delete" contenteditable="false" onclick="if(confirm('¿Seguro que quieres eliminar este bloque desplegable?')) this.closest('.toggle-container').remove();"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg></div><div class="toggle-header" contenteditable="false" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;" onclick="const c = this.closest('.toggle-container'); c.setAttribute('data-state', c.getAttribute('data-state') === 'open' ? 'closed' : 'open');"><div class="toggle-icon" style="color: rgba(255, 255, 255, 0.4); display: flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; transition: transform 0.3s;"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg></div><div class="toggle-summary" contenteditable="true" style="flex: 1; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; font-size: 13px; color: rgba(255, 255, 255, 0.8); outline: none;">${selectionText || 'Heading text'}</div></div><div class="toggle-content" contenteditable="true" style="margin-left: 2rem; margin-top: 0.5rem; font-size: 13px; color: rgba(255, 255, 255, 0.4); outline: none;">Empty toggle block</div></div><p><br></p>`;
                          document.execCommand('insertHTML', false, toggleHtml);
                        } else if (matchedLabel === 'Tabla') {
                          const tableHtml = `<table class="table-classic w-full border-collapse my-4"><tbody>${Array(3).fill(`<tr>${Array(5).fill('<td></td>').join('')}</tr>`).join('')}</tbody></table><p><br></p>`;
                          document.execCommand('insertHTML', false, tableHtml);
                        }
                        
                        if (editorRef.current) setContent(editorRef.current.innerHTML);
                        return;
                      }
                    }
                  }
                } catch (e) {}


                if (e.key === 'Backspace') {
                  const selection = window.getSelection();
                  if (selection?.isCollapsed) {
                    const anchorNode = selection.anchorNode;
                    const block = ((anchorNode?.nodeType === 3 ? anchorNode.parentElement : anchorNode) as HTMLElement | null)?.closest('.editor-content > *') as HTMLElement;
                    
                    if (block && editorRef.current?.contains(block)) {
                      const text = block.innerText.trim();
                      const isAtStart = selection.anchorOffset === 0;
                      
                      if (text === '' && isAtStart && editorRef.current.children.length > 1) {
                        e.preventDefault();
                        const prev = block.previousElementSibling as HTMLElement;
                        block.remove();
                        if (prev) {
                          const range = document.createRange();
                          range.selectNodeContents(prev);
                          range.collapse(false);
                          selection.removeAllRanges();
                          selection.addRange(range);
                          prev.focus();
                        }
                        if (editorRef.current) setContent(editorRef.current.innerHTML);
                        return;
                      }
                    }
                  }
                }

                // Keyboard formatting shortcuts
                const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes("Mac");
                const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

                if (isCmdOrCtrl) {
                  const key = e.key.toLowerCase();
                  if (key === 'b') {
                    e.preventDefault();
                    document.execCommand('bold');
                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                    return;
                  }
                  if (key === 'i') {
                    e.preventDefault();
                    document.execCommand('italic');
                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                    return;
                  }
                  if (key === 'u') {
                    e.preventDefault();
                    document.execCommand('underline');
                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                    return;
                  }
                }

                  if (e.key === 'Enter') {
                    const selection = window.getSelection();
                    const anchorNode = selection?.anchorNode;
                    const cell = ((anchorNode?.nodeType === 3 ? anchorNode.parentElement : anchorNode) as HTMLElement | null)?.closest('td, th') as HTMLTableCellElement;

                    if (cell) {
                      // Allow Shift+Enter for normal newlines within cell
                      if (e.shiftKey) return;

                      e.preventDefault();
                      const table = cell.closest('table') as HTMLTableElement;
                      const rowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex;
                      const colIndex = cell.cellIndex;

                      const focusCell = (target: HTMLTableCellElement) => {
                        const range = document.createRange();
                        const sel = window.getSelection();
                        range.selectNodeContents(target);
                        range.collapse(false);
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                        target.focus();
                      };

                      if (e.ctrlKey) {
                        // MOVE RIGHT
                        const nextCell = cell.nextElementSibling as HTMLTableCellElement;
                        if (nextCell) {
                          focusCell(nextCell);
                        } else if (rowIndex < table.rows.length - 1) {
                          focusCell(table.rows[rowIndex + 1].cells[0]);
                        }
                      } else {
                        // MOVE DOWN
                        const nextRow = table.rows[rowIndex + 1];
                        if (nextRow) {
                          const targetCell = nextRow.cells[colIndex];
                          if (targetCell) focusCell(targetCell);
                        } else {
                          // ADD NEW ROW AT END
                          const newRow = table.insertRow();
                          Array.from(table.rows[0].cells).forEach(() => {
                            const c = newRow.insertCell();
                            c.innerHTML = '<br>';
                          });
                          if (editorRef.current) setContent(editorRef.current.innerHTML);
                          setTimeout(() => {
                            const targetCell = table.rows[rowIndex + 1].cells[colIndex];
                            if (targetCell) focusCell(targetCell);
                          }, 10);
                        }
                      }
                      return;
                    }

                    // Handle blockquote (citation) Enter exit
                    const bq = ((anchorNode?.nodeType === 3 ? anchorNode.parentElement : anchorNode) as HTMLElement | null)?.closest('blockquote') as HTMLElement;
                    if (bq && bq.innerText.replace(/\n/g, '').trim() === '') {
                      e.preventDefault();
                      const p = document.createElement('p');
                      p.innerHTML = '<br>';
                      bq.parentNode?.replaceChild(p, bq);
                      
                      // Focus the new paragraph
                      const newRange = document.createRange();
                      newRange.selectNodeContents(p);
                      newRange.collapse(true);
                      selection?.removeAllRanges();
                      selection?.addRange(newRange);
                      
                      if (editorRef.current) setContent(editorRef.current.innerHTML);
                      return;
                    }

                    const container = anchorNode?.parentElement?.closest('.todo-item-container') as HTMLElement;
                    if (container) {
                    const currentText = (container.querySelector('[contenteditable="true"]') as HTMLElement)?.innerText.trim();
                    const isPlaceholder = currentText === 'Nueva nota' || currentText === 'Nueva tarea' || currentText === '...' || currentText === '';
                    
                    if (isPlaceholder) {
                      e.preventDefault();
                      const p = document.createElement('p');
                      p.innerHTML = '<br>';
                      container.parentNode?.replaceChild(p, container);
                      p.focus();
                      if (editorRef.current) setContent(editorRef.current.innerHTML);
                      return;
                    }

                    e.preventDefault();
                    const newTodo = document.createElement('div');
                    newTodo.className = 'todo-item-container';
                    newTodo.style.display = 'flex';
                    newTodo.style.alignItems = 'flex-start';
                    newTodo.style.gap = '0.75rem';
                    newTodo.style.margin = '0.5rem 0';
                    newTodo.style.width = '100%';
                    newTodo.innerHTML = `
                      <div contenteditable="false" style="display: flex; align-items: center; padding-top: 0.2rem; user-select: none;">
                        <input type="checkbox" onchange="const p = this.parentElement.nextElementSibling; if(this.checked){ p.style.textDecoration='line-through'; p.style.opacity='0.4'; this.style.background='hsl(var(--primary))'; this.style.backgroundImage='url(&quot;data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%224%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%2220 6 9 17 4 12%22%3E%3C/polyline%3E%3C/svg%3E&quot;)'; this.style.backgroundSize='80%'; this.style.backgroundRepeat='no-repeat'; this.style.backgroundPosition='center'; } else { p.style.textDecoration='none'; p.style.opacity='1'; this.style.background='transparent'; this.style.backgroundImage='none'; }" style="appearance: none; -webkit-appearance: none; width: 1.15rem; height: 1.15rem; border: 2.5px solid hsl(var(--primary)); border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: transparent;" />
                      </div>
                      <div contenteditable="true" style="flex: 1; outline: none; border: none; padding: 0; margin: 0; min-height: 1.2rem; color: inherit;">Nueva nota</div>
                    `;
                    
                    container.insertAdjacentElement('afterend', newTodo);
                    
                    setTimeout(() => {
                      const editable = newTodo.querySelector('[contenteditable="true"]') as HTMLElement;
                      if (editable) {
                        editable.focus();
                        const range = document.createRange();
                        range.selectNodeContents(editable);
                        const sel = window.getSelection();
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                      }
                      if (editorRef.current) setContent(editorRef.current.innerHTML);
                    }, 10);
                    return;
                  }

                  // Handle Toggle block Enter
                  const toggleSummary = ((anchorNode?.nodeType === 3 ? anchorNode.parentElement : anchorNode) as HTMLElement | null)?.closest('.toggle-summary') as HTMLElement;
                  if (toggleSummary) {
                    const text = toggleSummary.innerText.trim();
                    const isPlaceholder = text === 'Heading text' || text === 'Título' || text === '';
                    
                    if (isPlaceholder && e.key === 'Enter') {
                      e.preventDefault();
                      const container = toggleSummary.closest('.toggle-container');
                      if (container) {
                        const p = document.createElement('p');
                        p.innerHTML = '<br>';
                        container.parentNode?.replaceChild(p, container);
                        p.focus();
                        if (editorRef.current) setContent(editorRef.current.innerHTML);
                        return;
                      }
                    }

                    e.preventDefault();
                    const container = toggleSummary.closest('.toggle-container');
                    const content = container?.querySelector('.toggle-content') as HTMLElement;
                    if (content) {
                      content.focus();
                      // Place cursor at beginning
                      const range = document.createRange();
                      range.selectNodeContents(content);
                      range.collapse(true);
                      const sel = window.getSelection();
                      sel?.removeAllRanges();
                      sel?.addRange(range);
                    }
                    return;
                  }
                  
                  setTimeout(handleSelectionChange, 10);
                }
              }}
              spellCheck={isSpellcheckEnabled}
              style={{ fontSize: `${fontSize}px` }}
              className={cn(
                "editor-content w-full leading-relaxed min-h-[calc(100vh-320px)] outline-none text-foreground/80 min-h-[500px] pb-96",
                fontClass
              )}
              data-placeholder="Start typing or paste images..."
            ></div>

            {activeCitation && (
              <div 
                className="absolute z-[60] flex flex-col gap-2"
                style={{ 
                  top: citationBtnPos.top + 8,
                  left: citationBtnPos.left - 12
                }}
              >
                <button
                  className="citation-delete-btn w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all scale-90 hover:scale-100 animate-in zoom-in-50 duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCitationToDelete(activeCitation);
                    setShowCitationDialog(true);
                  }}
                >
                  <X size={14} strokeWidth={3} />
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="citation-delete-btn w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/80 transition-all scale-90 hover:scale-100 animate-in zoom-in-50 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Pencil size={12} strokeWidth={3} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-4 bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-4 w-60 z-[80]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Personalizar Cita</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Color de Barra</span>
                          <span className="text-[9px] font-mono text-white/20 uppercase">{(activeCitation.style.borderLeftColor || '#3b82f6')}</span>
                        </div>
                        <input 
                          type="color" 
                          defaultValue={rgb2hex(activeCitation.style.borderLeftColor) || "#3b82f6"} 
                          onInput={(e) => {
                            activeCitation.style.borderLeftColor = e.currentTarget.value;
                          }} 
                          className="w-full h-8 rounded-lg border border-white/5 cursor-pointer p-0 bg-transparent hover:scale-[1.02] transition-transform" 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Color de Fondo</span>
                          <span className="text-[9px] font-mono text-white/20 uppercase">{(activeCitation.style.backgroundColor || '#1a1a2e')}</span>
                        </div>
                        <input 
                          type="color" 
                          defaultValue={rgb2hex(activeCitation.style.backgroundColor) || "#1a1a2e"} 
                          onInput={(e) => {
                            const val = e.currentTarget.value;
                            activeCitation.style.backgroundColor = `${val}40`;
                            activeCitation.style.background = 'none'; // clear gradient
                            activeCitation.style.backgroundImage = 'none'; // clear gradient specifically
                            activeCitation.setAttribute('data-bg-color', val); // Store for persistence
                          }} 
                          className="w-full h-8 rounded-lg border border-white/5 cursor-pointer p-0 bg-transparent hover:scale-[1.02] transition-transform" 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Opacidad Fondo</span>
                          <span className="text-[9px] font-mono text-white/20 uppercase">{(activeCitation.style.backgroundColor && activeCitation.style.backgroundColor.includes('rgba') ? 'A' : 'Hex')}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          defaultValue={25}
                          onInput={(e) => {
                            const opacity = Math.round(parseInt(e.currentTarget.value) * 2.55).toString(16).padStart(2, '0');
                            const baseColor = activeCitation.getAttribute('data-bg-color') || '#1a1a2e';
                            activeCitation.style.backgroundColor = `${baseColor}${opacity}`;
                          }}
                          className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      {citationPresets.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] text-white/30 uppercase font-bold tracking-tight px-1">Presets Guardados</span>
                          <div className="flex flex-wrap gap-2 px-1">
                            {citationPresets.map((preset, idx) => (
                              <div key={idx} className="group/preset relative">
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    activeCitation.style.borderLeftColor = preset.border;
                                    activeCitation.style.backgroundColor = preset.bg;
                                    activeCitation.setAttribute('data-bg-color', preset.dataBg);
                                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                                    toast({ title: "Preset aplicado" });
                                  }}
                                  className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden hover:scale-105 transition-all shadow-md flex"
                                >
                                  <div className="w-[8px] h-full shrink-0" style={{ backgroundColor: preset.border }} />
                                  <div className="flex-1 h-full" style={{ backgroundColor: preset.bg }} />
                                </button>
                                <button 
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCitationPresets(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/preset:opacity-100 transition-opacity hover:scale-110 z-10"
                                >
                                  <X size={10} strokeWidth={3} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="h-px bg-white/5 my-1" />

                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const newPreset = {
                            border: activeCitation.style.borderLeftColor || "#3b82f6",
                            bg: activeCitation.style.backgroundColor || "#1a1a2e40",
                            dataBg: activeCitation.getAttribute('data-bg-color') || "#1a1a2e"
                          };
                          
                          // Check if already exists
                          const exists = citationPresets.some(p => p.bg === newPreset.bg && p.border === newPreset.border);
                          if (!exists) {
                            setCitationPresets(prev => [...prev, newPreset]);
                          }

                          if (editorRef.current) setContent(editorRef.current.innerHTML);
                          toast({ title: "Cambios aplicados", description: "Diseño actualizado y guardado en presets." });
                        }}
                        className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-primary/20 shadow-lg shadow-primary/5 group/confirm"
                      >
                        Confirmar Cambios
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {tableControls.show &&
              <div key="table-controls-overlay">
                {/* Table Options (Top Left) */}
                <div className="absolute z-[55]" style={{ top: tableControls.tableTop - 32, left: tableControls.tableLeft }}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        onMouseDown={(e) => e.preventDefault()}
                        className="w-8 h-7 bg-[#1a1a1a] border border-white/10 text-white/40 hover:text-white rounded-lg flex items-center justify-center shadow-2xl transition-all hover:bg-white/5 active:scale-95"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-[#141416] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[1.25rem] z-[80]">
                      <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 p-2 italic mb-1">Menú de Tabla</p>
                        
                        {/* Colors */}
                        <div className="px-2 mb-3">
                          <p className="text-[8px] font-black text-white/40 uppercase mb-2">Color de Celda</p>
                          <div className="flex flex-wrap gap-1.5">
                            {['#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', ''].map(color => (
                              <button
                                key={color}
                                onClick={() => {
                                  if (activeTableCell) {
                                    activeTableCell.style.backgroundColor = color ? `${color}22` : '';
                                    if (color) activeTableCell.style.setProperty('--cell-border-color', color);
                                    else activeTableCell.style.removeProperty('--cell-border-color');
                                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                                  }
                                }}
                                className="w-5 h-5 rounded-md border border-white/5 transition-transform hover:scale-110 flex items-center justify-center overflow-hidden"
                                style={{ backgroundColor: color || 'transparent' }}
                                title={color || 'Clear Color'}
                              >
                                {!color && <X size={10} className="text-white/20" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="h-px bg-white/5 my-1" />

                        {/* Design Toggle */}
                        <button 
                          onClick={() => {
                            if (activeTableCell) {
                              const table = activeTableCell.closest('table');
                              if (table) {
                                const isClassic = table.classList.contains('table-classic');
                                table.classList.remove('table-classic', 'table-cards');
                                table.classList.add(isClassic ? 'table-cards' : 'table-classic');
                                if (editorRef.current) setContent(editorRef.current.innerHTML);
                              }
                            }
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                            <LayoutGrid size={14} />
                          </div>
                          <span>Alternar Diseño</span>
                        </button>

                        {/* Delete */}
                        <button 
                          onClick={() => {
                            if (activeTableCell) {
                              const table = activeTableCell.closest('table');
                              if (table) table.remove();
                              if (editorRef.current) setContent(editorRef.current.innerHTML);
                              setTableControls(prev => ({ ...prev, show: false }));
                            }
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-tight text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                            <Trash2 size={14} />
                          </div>
                          <span>Eliminar Tabla</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Column Selection Pill (Top) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div 
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // SELECT ALL TEXT IN COLUMN
                        const table = (activeTableCell as any)?.closest('table');
                        if (table && activeTableCell) {
                          const colIndex = activeTableCell.cellIndex;
                          const cells = (Array.from(table.rows) as HTMLTableRowElement[]).map(row => row.cells[colIndex]);
                          const sel = window.getSelection();
                          const range = document.createRange();
                          if (cells[0] && cells[cells.length - 1]) {
                             range.setStartBefore(cells[0]);
                             range.setEndAfter(cells[cells.length - 1]);
                             sel?.removeAllRanges();
                             sel?.addRange(range);
                          }
                        }
                      }}
                      className="absolute z-[40] h-2 bg-primary/30 rounded-full transition-all duration-200 hover:bg-primary/60 cursor-pointer pointer-events-auto shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                      style={{ 
                        top: tableControls.tableTop - 12,
                        left: tableControls.cellLeft,
                        width: tableControls.cellWidth
                      }}
                    />
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-52 p-1.5 bg-[#141416]/95 backdrop-blur-xl border-white/10 rounded-2xl shadow-2xl z-[90]">
                    <div className="flex flex-col gap-0.5">
                      <HandleButton 
                        icon={<Plus size={14} />} 
                        label="Insert Column Left" 
                        onClick={() => {
                          if (activeTableCell) {
                            const colIndex = activeTableCell.cellIndex;
                            const table = activeTableCell.closest('table');
                            if (table) {
                              Array.from(table.rows).forEach(row => {
                                const newCell = row.insertCell(colIndex);
                                newCell.innerHTML = '<br>';
                                newCell.classList.add('p-4', 'border', 'border-white/20');
                              });
                              if (editorRef.current) setContent(editorRef.current.innerHTML);
                            }
                          }
                        }} 
                      />
                      <HandleButton 
                        icon={<Plus size={14} />} 
                        label="Insert Column Right" 
                        onClick={() => {
                          if (activeTableCell) {
                            const colIndex = activeTableCell.cellIndex;
                            const table = activeTableCell.closest('table');
                            if (table) {
                              Array.from(table.rows).forEach(row => {
                                const newCell = row.insertCell(colIndex + 1);
                                newCell.innerHTML = '<br>';
                                newCell.classList.add('p-4', 'border', 'border-white/20');
                              });
                              if (editorRef.current) setContent(editorRef.current.innerHTML);
                            }
                          }
                        }} 
                      />
                      <HandleButton 
                        icon={<ArrowRight size={14} />} 
                        label="Move Right" 
                        onClick={() => {
                          if (activeTableCell) {
                            const colIndex = activeTableCell.cellIndex;
                            const table = activeTableCell.closest('table');
                            if (table && colIndex < table.rows[0].cells.length - 1) {
                              Array.from(table.rows).forEach(row => {
                                const cells = Array.from(row.cells);
                                const current = cells[colIndex];
                                const next = cells[colIndex + 1];
                                if (current && next) row.insertBefore(next, current);
                              });
                              if (editorRef.current) setContent(editorRef.current.innerHTML);
                            }
                          }
                        }} 
                      />
                      <div className="h-px bg-white/5 my-1" />
                      <HandleButton 
                        icon={<Trash2 size={14} />} 
                        label="Delete Column" 
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500" 
                        onClick={() => {
                          if (activeTableCell) {
                            const colIndex = activeTableCell.cellIndex;
                            const table = activeTableCell.closest('table');
                            if (table) {
                              Array.from(table.rows).forEach(row => {
                                if (row.cells[colIndex]) row.deleteCell(colIndex);
                              });
                              setActiveTableCell(null);
                              setTableControls(prev => ({ ...prev, show: false }));
                              if (editorRef.current) setContent(editorRef.current.innerHTML);
                            }
                          }
                        }} 
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Row Selection Pill (Left) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div 
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // SELECT ALL TEXT IN ROW
                        const table = (activeTableCell as any)?.closest('table');
                        if (table) {
                          const row = (activeTableCell as any).parentElement as HTMLTableRowElement;
                          const sel = window.getSelection();
                          const range = document.createRange();
                          range.selectNodeContents(row);
                          sel?.removeAllRanges();
                          sel?.addRange(range);
                        }
                      }}
                      className="absolute z-[40] w-2 bg-primary/30 rounded-full transition-all duration-200 hover:bg-primary/60 cursor-pointer pointer-events-auto shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                      style={{ 
                        top: tableControls.cellTop,
                        left: tableControls.tableLeft - 12,
                        height: tableControls.cellHeight
                      }}
                    />
                  </PopoverTrigger>
                  <PopoverContent side="left" align="start" className="w-52 p-1.5 bg-[#141416]/95 backdrop-blur-xl border-white/10 rounded-2xl shadow-2xl z-[90]">
                    <div className="flex flex-col gap-0.5">
                      <HandleButton 
                        icon={<Plus size={14} />} 
                        label="Insert Row Before" 
                        onClick={() => {
                          if (activeTableCell) {
                            const row = (activeTableCell as any).parentElement as HTMLTableRowElement;
                            const newRow = row.cloneNode(true) as HTMLTableRowElement;
                            Array.from(newRow.cells).forEach(cell => cell.innerHTML = '<br>');
                            row.parentNode?.insertBefore(newRow, row);
                            if (editorRef.current) setContent(editorRef.current.innerHTML);
                          }
                        }} 
                      />
                      <HandleButton 
                        icon={<Plus size={14} />} 
                        label="Insert Row After" 
                        onClick={() => {
                          if (activeTableCell) {
                            const row = (activeTableCell as any).parentElement as HTMLTableRowElement;
                            const newRow = row.cloneNode(true) as HTMLTableRowElement;
                            Array.from(newRow.cells).forEach(cell => cell.innerHTML = '<br>');
                            row.parentNode?.insertBefore(newRow, row.nextSibling);
                            if (editorRef.current) setContent(editorRef.current.innerHTML);
                          }
                        }} 
                      />
                      <HandleButton 
                        icon={<ArrowUp size={14} />} 
                        label="Move Up" 
                        onClick={() => {
                          if (activeTableCell) {
                            const row = (activeTableCell as any).parentElement as HTMLTableRowElement;
                            const sibling = row.previousElementSibling;
                            if (sibling) {
                              row.parentNode?.insertBefore(row, sibling);
                              if (editorRef.current) setContent(editorRef.current.innerHTML);
                            }
                          }
                        }} 
                      />
                      <HandleButton 
                        icon={<ArrowUp size={14} />} 
                        label="Expand Height" 
                        onClick={() => {
                          if (activeTableCell) {
                            const row = (activeTableCell as any).parentElement as HTMLTableRowElement;
                            Array.from(row.cells).forEach((cell: any) => {
                              const current = parseInt(cell.style.height || '40');
                              cell.style.height = `${current + 20}px`;
                            });
                            if (editorRef.current) setContent(editorRef.current.innerHTML);
                          }
                        }} 
                      />
                      <HandleButton 
                        icon={<ArrowDown size={14} />} 
                        label="Shrink Height" 
                        onClick={() => {
                          if (activeTableCell) {
                            const row = (activeTableCell as any).parentElement as HTMLTableRowElement;
                            Array.from(row.cells).forEach((cell: any) => {
                              const current = parseInt(cell.style.height || '40');
                              cell.style.height = `${Math.max(20, current - 20)}px`;
                            });
                            if (editorRef.current) setContent(editorRef.current.innerHTML);
                          }
                        }} 
                      />
                      <div className="h-px bg-white/5 my-1" />
                      <HandleButton 
                        icon={<Trash2 size={14} />} 
                        label="Delete Row" 
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500" 
                        onClick={() => {
                          if (activeTableCell) {
                            const row = (activeTableCell as any).parentElement as HTMLTableRowElement;
                            row.remove();
                            setActiveTableCell(null);
                            setTableControls(prev => ({ ...prev, show: false }));
                            if (editorRef.current) setContent(editorRef.current.innerHTML);
                          }
                        }} 
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Drag Row Resizer (Inside first column) */}
                {(() => {
                  const table = (activeTableCell as any)?.closest('table') as HTMLTableElement;
                  if (!table) return null;
                  const editorRect = editorRef.current?.parentElement?.getBoundingClientRect();
                  if (!editorRect) return null;

                  return Array.from(table.rows).map((row, idx) => {
                    const rowRect = row.getBoundingClientRect();
                    return (
                      <div
                        key={`row-drag-${idx}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const firstCell = row.cells[0];
                          if (firstCell) {
                            setIsResizing({
                              target: firstCell,
                              direction: 'row',
                              startX: e.clientX,
                              startY: e.clientY,
                              startWidth: firstCell.offsetWidth,
                              startHeight: firstCell.offsetHeight
                            });
                          }
                        }}
                        className="absolute z-[42] w-6 h-[4px] bg-red-600/30 hover:bg-red-500/80 transition-all rounded-full cursor-row-resize group shadow-[0_0_8px_rgba(220,38,38,0.2)]"
                        title="Drag to resize row height"
                        style={{ 
                          top: rowRect.bottom - editorRect.top - 2,
                          left: tableControls.tableLeft + 4
                        }}
                      >
                        <div className="absolute inset-x-0 -top-2 -bottom-2" />
                      </div>
                    );
                  });
                })()}

                {/* Drag Column Resizer (Top Edge) */}
                {(() => {
                  const table = (activeTableCell as any)?.closest('table') as HTMLTableElement;
                  if (!table) return null;
                  const editorRect = editorRef.current?.parentElement?.getBoundingClientRect();
                  if (!editorRect) return null;

                  return Array.from(table.rows[0].cells).map((cell, idx) => {
                    const cellRect = cell.getBoundingClientRect();
                    return (
                      <div
                        key={`col-drag-${idx}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing({
                            target: cell,
                            direction: 'col',
                            startX: e.clientX,
                            startY: e.clientY,
                            startWidth: cell.offsetWidth,
                            startHeight: cell.offsetHeight
                          });
                        }}
                        className="absolute z-[42] h-[4px] bg-red-600/30 hover:bg-red-500/80 transition-all rounded-full cursor-col-resize group shadow-[0_0_10px_rgba(220,38,38,0.2)]"
                        title="Drag to resize column width"
                        style={{ 
                          top: tableControls.tableTop + 2,
                          left: cellRect.left - editorRect.left + 4,
                          width: cellRect.width - 8
                        }}
                      >
                        <div className="absolute inset-x-0 -top-2 -bottom-2" />
                      </div>
                    );
                  });
                })()}
                
                {/* Add Column (Right) */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!activeTableCell) return;
                    const table = activeTableCell.closest('table');
                    if (!table) return;
                    for (let i = 0; i < table.rows.length; i++) {
                      const cell = table.rows[i].insertCell();
                      cell.innerHTML = '<br>';
                      cell.classList.add('p-4', 'border', 'border-white/20');
                    }
                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                  }}
                  className="absolute z-[50] w-6 h-6 bg-[#1a1a1a] border border-white/10 text-white/40 hover:text-white rounded-md flex items-center justify-center shadow-lg hover:bg-primary hover:border-primary transition-all active:scale-95"
                  style={{ 
                    top: tableControls.cellTop + tableControls.cellHeight/2 - 12,
                    left: tableControls.tableLeft + tableControls.tableWidth + 8
                  }}
                >
                  <Plus size={14} />
                </button>

                {/* Add Row (Bottom) */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!activeTableCell) return;
                    const table = activeTableCell.closest('table');
                    if (!table) return;
                    const row = table.insertRow();
                    const cellCount = table.rows[0].cells.length;
                    for (let i = 0; i < cellCount; i++) {
                      const cell = row.insertCell();
                      cell.innerHTML = '<br>';
                      cell.classList.add('p-4', 'border', 'border-white/20');
                    }
                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                  }}
                  className="absolute z-[50] w-6 h-6 bg-[#1a1a1a] border border-white/10 text-white/40 hover:text-white rounded-md flex items-center justify-center shadow-lg hover:bg-primary hover:border-primary transition-all active:scale-95"
                  style={{ 
                    top: tableControls.tableTop + tableControls.tableHeight + 8,
                    left: tableControls.cellLeft + tableControls.cellWidth/2 - 12
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            }
          </div>

          <AlertDialog open={!!pendingPaste} onOpenChange={() => setPendingPaste(null)}>
            <AlertDialogContent className="bg-[#0f0f11]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl max-w-lg">
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <Hash size={20} className="text-primary animate-pulse" />
                  </div>
                  <AlertDialogTitle className="text-2xl font-black italic tracking-tighter text-white/90">
                    CONVERTIR A TABLA
                  </AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-white/40 text-sm font-medium leading-relaxed">
                  Hemos detectado una estructura tabular. ¿Cómo te gustaría insertar este contenido?
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="grid grid-cols-2 gap-4 my-6">
                <button 
                  onClick={() => processPendingPaste('classic')}
                  className="group relative flex flex-col gap-3 p-4 bg-white/5 border border-white/5 hover:border-primary/50 rounded-2xl transition-all text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Estilo 01</div>
                  <h4 className="text-sm font-black text-white italic">TABLA CLÁSICA</h4>
                  <p className="text-[10px] text-white/30 leading-tight">Diseño de rejilla técnica con bordes finos y espaciado optimizado.</p>
                </button>
                
                <button 
                  onClick={() => processPendingPaste('cards')}
                  className="group relative flex flex-col gap-3 p-4 bg-white/5 border border-white/5 hover:border-accent/50 rounded-2xl transition-all text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-accent italic">Estilo 02</div>
                  <h4 className="text-sm font-black text-white italic">MODERN CARDS</h4>
                  <p className="text-[10px] text-white/30 leading-tight">Diseño Pro con tarjetas interactivas, elevación y efectos de hover.</p>
                </button>
              </div>

              <AlertDialogFooter className="mt-2 gap-3">
                <AlertDialogCancel 
                  onClick={() => processPendingPaste('text')}
                  className="bg-transparent border-none text-white/20 hover:text-white/60 hover:bg-transparent text-[10px] font-black uppercase tracking-widest transition-all h-auto py-2"
                >
                  Pegar solo como texto normal
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showCitationDialog} onOpenChange={setShowCitationDialog}>
            <AlertDialogContent className="bg-[#141416] border-white/10 rounded-[2rem] p-8 max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Eliminar Cita</AlertDialogTitle>
                <AlertDialogDescription className="text-white/40 text-sm font-medium">
                  ¿Cómo deseas proceder con la eliminación de esta cita?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-3 mt-6">
                <Button 
                  onClick={() => removeCitation('only-cita')}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 rounded-xl border-white/5 hover:bg-white/5 font-bold uppercase text-[11px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Hash size={14} />
                  </div>
                  Eliminar solo la cita (mantener texto)
                </Button>
                <Button 
                  onClick={() => removeCitation('cita-and-text')}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 rounded-xl border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 font-bold uppercase text-[11px] text-red-500"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                    <Trash2 size={14} />
                  </div>
                  Eliminar cita y todo su contenido
                </Button>
              </div>
              <AlertDialogFooter className="mt-8 border-t border-white/5 pt-6">
                <AlertDialogCancel className="rounded-xl font-bold uppercase border-none hover:bg-white/5">Cancelar</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {showImageToolbar && activeImage && (
            <ImageToolbar 
              position={menuPosition}
              activeImage={activeImage}
              onClose={() => {
                setShowImageToolbar(false);
                setActiveImage(null);
                editorRef.current?.querySelectorAll('img').forEach(img => img.classList.remove('active-image'));
              }}
              onUpdate={() => {
                if (editorRef.current) {
                  editorRef.current.querySelectorAll('img').forEach(img => img.classList.remove('active-image'));
                  setContent(editorRef.current.innerHTML);
                  if (activeImage) activeImage.classList.add('active-image');
                }
              }}
            />
          )}
        </div>
      </div>

      <footer className="h-10 border-t border-white/5 bg-transparent flex items-center justify-between px-8 text-[11px] text-muted-foreground/50 font-medium">
        <div className="flex items-center gap-6">
          <span>{stats.words} WORDS</span>
          <span>{stats.readTime} MIN READ</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isSaved ? (
            <div className="flex items-center gap-1.5 text-green-500/50">
              <CheckCircle2 size={12} />
              <span>AUTO SAVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-orange-500/50">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>SYNCING</span>
            </div>
          )}
        </div>
      </footer>

      <style jsx global>{`
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.05);
          cursor: text;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 1);
        }
        .editor-content img.active-image {
          outline: 4px solid hsl(var(--primary));
          outline-offset: 2px;
          cursor: pointer;
        }
        .editor-content blockquote {
          position: relative;
          transition: all 0.2s;
        }
        .editor-content blockquote:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .luvia-math {
          display: inline-block !important;
          width: auto !important;
          margin: 0 4px !important;
          vertical-align: middle;
          position: relative;
          overflow: visible !important;
        }
        .luvia-math .math-controls {
          position: absolute;
          top: -36px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 2px;
          background: #1a1a1f;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 3px;
          z-index: 9999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .luvia-math:hover .math-controls {
          opacity: 1;
          pointer-events: auto;
        }
        .luvia-math .katex-display {
          display: inline-block !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .luvia-math .katex {
          font-size: 1.1em;
          line-height: 1.2;
        }
        /* Fix huge cursor in Chrome/Safari */
        .editor-content * {
          overflow-wrap: break-word;
        }
      `}</style>
      
      <ImageResizer 
        activeImage={activeImage} 
        onResize={() => {
          if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
            setIsSaved(false);
          }
        }} 
      />
    </div>
  );
};
export default Notebook;