
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, AlignLeft, AlignCenter, AlignRight, X, Pencil, Crop, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface ImageToolbarProps {
  position: { x: number; y: number };
  activeImage: HTMLImageElement;
  onClose: () => void;
  onUpdate: () => void;
}

const ImageToolbar = ({ position, activeImage, onClose, onUpdate }: ImageToolbarProps) => {
  const [width, setWidth] = useState(100);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 }); // en porcentaje
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [activeCorner, setActiveCorner] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, startX: 0, startY: 0, startW: 0, startH: 0 });

  useEffect(() => {
    const currentWidth = activeImage.style.width;
    if (currentWidth.endsWith('%')) {
      setWidth(parseInt(currentWidth));
    } else {
      setWidth(100);
    }
  }, [activeImage]);

  const handleWidthChange = (val: number[]) => {
    const newWidth = val[0];
    setWidth(newWidth);
    activeImage.style.width = `${newWidth}%`;
    activeImage.style.maxWidth = '100%';
    onUpdate();
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') {
      activeImage.style.display = 'block';
      activeImage.style.marginLeft = 'auto';
      activeImage.style.marginRight = 'auto';
      activeImage.style.float = 'none';
    } else if (align === 'left') {
      activeImage.style.display = 'inline';
      activeImage.style.marginLeft = '0';
      activeImage.style.marginRight = '1.5rem';
      activeImage.style.float = 'left';
    } else {
      activeImage.style.display = 'inline';
      activeImage.style.marginLeft = '1.5rem';
      activeImage.style.marginRight = '0';
      activeImage.style.float = 'right';
    }
    onUpdate();
  };

  const handleDelete = () => {
    activeImage.remove();
    onClose();
    onUpdate();
  };

  const executeCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeImage.src;

    img.onload = () => {
      const sourceX = (cropArea.x / 100) * img.naturalWidth;
      const sourceY = (cropArea.y / 100) * img.naturalHeight;
      const sourceWidth = (cropArea.width / 100) * img.naturalWidth;
      const sourceHeight = (cropArea.height / 100) * img.naturalHeight;

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, sourceWidth, sourceHeight
      );

      const croppedDataUrl = canvas.toDataURL('image/png');
      activeImage.src = croppedDataUrl;
      setIsCropModalOpen(false);
      onUpdate();
    };
  };

  // Corner Resize Logic
  const handleCornerMouseDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setActiveCorner(corner);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: cropArea.x,
      startY: cropArea.y,
      startW: cropArea.width,
      startH: cropArea.height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !activeCorner || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.mouseX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.mouseY) / rect.height) * 100;

      let newCrop = { ...cropArea };

      switch (activeCorner) {
        case 'tl':
          newCrop.x = Math.max(0, Math.min(dragStart.startX + dragStart.startW - 5, dragStart.startX + deltaX));
          newCrop.width = dragStart.startW - (newCrop.x - dragStart.startX);
          newCrop.y = Math.max(0, Math.min(dragStart.startY + dragStart.startH - 5, dragStart.startY + deltaY));
          newCrop.height = dragStart.startH - (newCrop.y - dragStart.startY);
          break;
        case 'tr':
          newCrop.width = Math.max(5, Math.min(100 - dragStart.startX, dragStart.startW + deltaX));
          newCrop.y = Math.max(0, Math.min(dragStart.startY + dragStart.startH - 5, dragStart.startY + deltaY));
          newCrop.height = dragStart.startH - (newCrop.y - dragStart.startY);
          break;
        case 'bl':
          newCrop.x = Math.max(0, Math.min(dragStart.startX + dragStart.startW - 5, dragStart.startX + deltaX));
          newCrop.width = dragStart.startW - (newCrop.x - dragStart.startX);
          newCrop.height = Math.max(5, Math.min(100 - dragStart.startY, dragStart.startH + deltaY));
          break;
        case 'br':
          newCrop.width = Math.max(5, Math.min(100 - dragStart.startX, dragStart.startW + deltaX));
          newCrop.height = Math.max(5, Math.min(100 - dragStart.startY, dragStart.startH + deltaY));
          break;
      }

      setCropArea(newCrop);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveCorner(null);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, activeCorner, dragStart, cropArea]);

  return (
    <TooltipProvider>
      {!isCropModalOpen && (
        <div 
          className="fixed z-[60] flex items-center gap-2 bg-[#121212]/90 border border-white/10 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] p-2 backdrop-blur-xl animate-in zoom-in-95 fade-in duration-200"
          style={{ left: position.x, top: position.y, transform: 'translateX(-50%) translateY(-120%)' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 px-2 border-r border-white/5">
            <span className="text-[10px] font-black uppercase text-white/20 italic mr-2">SIZE</span>
            <div className="w-32 px-2">
              <Slider 
                value={[width]} 
                onValueChange={handleWidthChange} 
                min={10} 
                max={100} 
                step={1} 
              />
            </div>
            <span className="text-[10px] font-black text-primary w-8 text-center">{width}%</span>
          </div>

          <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
            <ToolbarButton icon={<AlignLeft size={16} />} label="Align Left" onClick={() => handleAlign('left')} />
            <ToolbarButton icon={<AlignCenter size={16} />} label="Align Center" onClick={() => handleAlign('center')} />
            <ToolbarButton icon={<AlignRight size={16} />} label="Align Right" onClick={() => handleAlign('right')} />
          </div>

          <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
            <ToolbarButton 
              icon={<Pencil size={16} className="text-primary" />} 
              label="Crop Image" 
              onClick={() => setIsCropModalOpen(true)} 
            />
          </div>

          <div className="flex items-center gap-1 pl-1">
            <ToolbarButton icon={<Trash2 size={16} className="text-destructive/60" />} label="Remove Image" onClick={handleDelete} />
            <ToolbarButton icon={<X size={16} />} label="Close" onClick={onClose} />
          </div>
        </div>
      )}

      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="max-w-3xl bg-[#0d0d0f] border-white/10 rounded-[2rem] p-0 overflow-hidden shadow-3xl">
          <DialogHeader className="p-6 border-b border-white/5">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg text-primary"><Crop size={20} /></div>
              Recortar Imagen
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 flex flex-col items-center gap-6">
            <div 
              ref={containerRef}
              className="relative border-2 border-white/5 rounded-2xl overflow-hidden bg-black/40 group select-none"
            >
              <img 
                src={activeImage.src} 
                className="max-h-[500px] w-auto block opacity-40 grayscale-[0.5] pointer-events-none" 
                alt="Crop preview" 
              />
              
              {/* Manual Resizable Crop Selection */}
              <div 
                className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-default transition-[box-shadow]"
                style={{
                  left: `${cropArea.x}%`,
                  top: `${cropArea.y}%`,
                  width: `${cropArea.width}%`,
                  height: `${cropArea.height}%`
                }}
              >
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                </div>

                {/* Draggable Corners */}
                <div 
                  onMouseDown={(e) => handleCornerMouseDown(e, 'tl')}
                  className="absolute -top-3 -left-3 w-6 h-6 bg-primary rounded-lg cursor-nwse-resize shadow-lg hover:scale-110 active:scale-95 transition-transform z-10" 
                />
                <div 
                  onMouseDown={(e) => handleCornerMouseDown(e, 'tr')}
                  className="absolute -top-3 -right-3 w-6 h-6 bg-primary rounded-lg cursor-nesw-resize shadow-lg hover:scale-110 active:scale-95 transition-transform z-10" 
                />
                <div 
                  onMouseDown={(e) => handleCornerMouseDown(e, 'bl')}
                  className="absolute -bottom-3 -left-3 w-6 h-6 bg-primary rounded-lg cursor-nesw-resize shadow-lg hover:scale-110 active:scale-95 transition-transform z-10" 
                />
                <div 
                  onMouseDown={(e) => handleCornerMouseDown(e, 'br')}
                  className="absolute -bottom-3 -right-3 w-6 h-6 bg-primary rounded-lg cursor-nwse-resize shadow-lg hover:scale-110 active:scale-95 transition-transform z-10" 
                />
              </div>
            </div>

            <div className="w-full space-y-4">
              <p className="text-[10px] text-center font-black uppercase tracking-[0.2em] text-white/20 italic">Arrastra las esquinas para ajustar la selección</p>
            </div>
          </div>

          <DialogFooter className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
            <Button variant="ghost" onClick={() => setIsCropModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white italic">Cancelar</Button>
            <Button onClick={executeCrop} className="bg-primary hover:bg-primary/90 rounded-xl px-8 h-12 flex items-center gap-2 shadow-2xl">
              <Check size={18} />
              <span className="font-black text-xs uppercase italic tracking-tighter">Aplicar Recorte</span>
            </Button>
          </DialogFooter>
          
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
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

export default ImageToolbar;
