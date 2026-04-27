import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Palette, HelpCircle, Moon, Monitor, Sun, Minus, Plus, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: 'sans' | 'serif' | 'mono';
  setFontFamily: (font: 'sans' | 'serif' | 'mono') => void;
  theme: string;
  setTheme: (theme: string) => void;
  isSpellcheckEnabled: boolean;
  setIsSpellcheckEnabled: (val: boolean) => void;
  isShortcutMenuOnly: boolean;
  setIsShortcutMenuOnly: (val: boolean) => void;
}

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  fontSize, 
  setFontSize, 
  fontFamily, 
  setFontFamily, 
  theme, 
  setTheme,
  isSpellcheckEnabled,
  setIsSpellcheckEnabled,
  isShortcutMenuOnly,
  setIsShortcutMenuOnly
}: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'appearance'>('appearance');

  if (!isOpen) return null;

  const handleDecreaseFont = () => {
    setFontSize(Math.max(12, fontSize - 2));
  };
  
  const handleIncreaseFont = () => {
    setFontSize(Math.min(36, fontSize + 2));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl h-[600px] flex bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sidebar Menu */}
        <div className="w-64 bg-[#111111] border-r border-white/5 flex flex-col pt-8">
          <div className="flex-1 space-y-1 px-3">
            <button
              onClick={() => setActiveTab('appearance')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all",
                activeTab === 'appearance' 
                  ? "bg-[#252525] text-white" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Palette size={16} /> Appearance
            </button>
          </div>
          
          <div className="p-4 border-t border-white/5 mt-auto">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all">
              <HelpCircle size={15} /> Help & Feedback
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-[#161616]">
          {/* Header */}
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 shrink-0">
            <h2 className="text-sm font-bold text-white capitalize">{activeTab}</h2>
            <button 
              onClick={onClose} 
              className="text-white/50 hover:text-white hover:bg-white/5 p-2 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-10 max-w-3xl text-white">
            {activeTab === 'appearance' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Theme Section */}
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <h3 className="text-[13px] font-bold text-white mb-1">Theme</h3>
                    <p className="text-xs text-white/50">Choose your preferred color theme</p>
                  </div>
                  
                  <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl gap-1 shrink-0">
                    <button 
                      onClick={() => setTheme('default')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                        theme === 'default' ? "bg-[#252525] text-white shadow" : "text-white/40 hover:text-white"
                      )}
                    >
                      <Moon size={14} className={theme === 'default' ? "text-primary" : ""} /> Dark
                    </button>
                    <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold text-white/40 cursor-not-allowed" title="Coming soon">
                      <Monitor size={14} /> System
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                        theme === 'light' ? "bg-white text-black shadow" : "text-white/40 hover:text-white"
                      )}
                    >
                      <Sun size={14} className={theme === 'light' ? "text-amber-500" : ""} /> Light
                    </button>
                  </div>
                </div>

                {/* Interface Colors Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-start justify-between">
                    <div className="pr-4">
                      <h3 className="text-[13px] font-bold text-white mb-1">Colors / Interface</h3>
                      <p className="text-xs text-white/50">Personaliza el diseño abstracto de la interfaz y los colores</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Luvia Default */}
                    <button 
                      onClick={() => setTheme('default')}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                        theme === 'default' 
                          ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-primary" 
                          : "bg-[#111] border-white/5 hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      <div className="w-full h-20 bg-[#0d0d0f] rounded-lg border border-white/5 mb-3 flex overflow-hidden">
                        <div className="w-[30%] bg-[#161616] h-full border-r border-white/5"></div>
                        <div className="flex-1 bg-[#0d0d0f] h-full p-3 flex flex-col gap-2">
                          <div className="w-1/2 h-1.5 bg-white/10 rounded-full"></div>
                          <div className="w-3/4 h-1.5 bg-white/5 rounded-full"></div>
                        </div>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-white mb-1">Luvia Default</span>
                      <span className="text-[10px] text-white/40 leading-tight">Oscuro clásico, sólido y directo.</span>
                    </button>
                    
                    {/* Aurora Glass */}
                    <button 
                      onClick={() => setTheme('aurora')}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                        theme === 'aurora' 
                          ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-primary" 
                          : "bg-[#111] border-white/5 hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      <div className="w-full h-20 rounded-lg border border-indigo-500/20 mb-3 flex overflow-hidden relative" style={{ background: 'radial-gradient(ellipse at 10% 0%, rgba(99,102,241,0.25) 0%, transparent 55%), radial-gradient(ellipse at 90% 80%, rgba(168,85,247,0.18) 0%, transparent 55%), #050508' }}>
                        <div className="w-[30%] h-full border-r border-indigo-500/10" style={{ background: 'rgba(20,20,35,0.4)', backdropFilter: 'blur(8px)' }}></div>
                        <div className="flex-1 h-full p-3 flex flex-col gap-2 relative z-10">
                          <div className="w-1/2 h-1.5 bg-indigo-400/30 rounded-full"></div>
                          <div className="w-3/4 h-1.5 bg-white/10 rounded-full"></div>
                        </div>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-white mb-1 flex items-center gap-1.5">
                        Aurora Glass <Sparkles size={9} className="text-primary animate-pulse" />
                      </span>
                      <span className="text-[10px] text-white/40 leading-tight">Cristal holográfico y neón difuminado.</span>
                    </button>

                    {/* Crimson Void */}
                    <button 
                      onClick={() => setTheme('crimson')}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                        theme === 'crimson' 
                          ? "border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-red-500/60" 
                          : "bg-[#111] border-white/5 hover:border-red-500/20 hover:bg-white/5",
                        theme === 'crimson' ? 'bg-red-500/10' : ''
                      )}
                    >
                      <div className="w-full h-20 rounded-lg border border-red-900/30 mb-3 flex overflow-hidden relative" style={{ background: 'radial-gradient(ellipse at 10% 0%, rgba(239,68,68,0.22) 0%, transparent 50%), radial-gradient(ellipse at 90% 90%, rgba(153,27,27,0.16) 0%, transparent 50%), #030101' }}>
                        <div className="w-[30%] h-full border-r border-red-900/20" style={{ background: 'rgba(15,4,4,0.5)', backdropFilter: 'blur(8px)' }}></div>
                        <div className="flex-1 h-full p-3 flex flex-col gap-2 relative z-10">
                          <div className="w-1/2 h-1.5 rounded-full" style={{ background: 'rgba(239,68,68,0.45)' }}></div>
                          <div className="w-3/4 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}></div>
                        </div>
                        {/* Ember dot */}
                        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.6)] animate-pulse"></div>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-white mb-1 flex items-center gap-1.5">
                        Crimson Void <span className="text-red-500 text-[9px]">●</span>
                      </span>
                      <span className="text-[10px] text-white/40 leading-tight">Negro absoluto con fuego rojo neón.</span>
                    </button>

                    {/* Emerald Mist */}
                    <button 
                      onClick={() => setTheme('emerald')}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                        theme === 'emerald' 
                          ? "border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/50" 
                          : "bg-[#111] border-white/5 hover:border-emerald-500/20 hover:bg-white/5",
                        theme === 'emerald' ? 'bg-emerald-500/10' : ''
                      )}
                    >
                      <div className="w-full h-20 rounded-lg border border-emerald-900/30 mb-3 flex overflow-hidden relative" style={{ background: 'radial-gradient(ellipse at 15% 0%, rgba(16,185,129,0.18) 0%, transparent 50%), radial-gradient(ellipse at 85% 90%, rgba(5,150,105,0.12) 0%, transparent 50%), #010806' }}>
                        <div className="w-[30%] h-full border-r border-emerald-900/20" style={{ background: 'rgba(4,14,10,0.52)', backdropFilter: 'blur(8px)' }}></div>
                        <div className="flex-1 h-full p-3 flex flex-col gap-2 relative z-10">
                          <div className="w-1/2 h-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.40)' }}></div>
                          <div className="w-3/4 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}></div>
                        </div>
                        {/* Mist particles */}
                        <div className="absolute top-2 left-6 w-6 h-1 rounded-full bg-emerald-400/10 blur-sm"></div>
                        <div className="absolute bottom-3 right-4 w-8 h-1 rounded-full bg-emerald-400/8 blur-sm"></div>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-white mb-1 flex items-center gap-1.5">
                        Emerald Mist <span className="text-emerald-400 text-[9px]">◆</span>
                      </span>
                      <span className="text-[10px] text-white/40 leading-tight">Bosque nocturno digital, calma total.</span>
                    </button>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* Advanced Section */}
                <div className="space-y-8">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/30">ADVANCED / EDITOR</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-2xl">
                      <div>
                        <h3 className="text-[13px] font-bold text-white mb-0.5">Corrección Ortográfica</h3>
                        <p className="text-[11px] text-white/40">Activar subrayado rojo para errores de escritura.</p>
                      </div>
                      <button 
                        onClick={() => setIsSpellcheckEnabled(!isSpellcheckEnabled)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          isSpellcheckEnabled ? "bg-primary" : "bg-white/10"
                        )}
                      >
                        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", isSpellcheckEnabled ? "left-7" : "left-1")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-2xl">
                      <div>
                        <h3 className="text-[13px] font-bold text-white mb-0.5">Atajo de Menú Flotante</h3>
                        <p className="text-[11px] text-white/40">El menú solo aparecerá con Ctrl + Alt + F.</p>
                      </div>
                      <button 
                        onClick={() => setIsShortcutMenuOnly(!isShortcutMenuOnly)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          isShortcutMenuOnly ? "bg-primary" : "bg-white/10"
                        )}
                      >
                        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", isShortcutMenuOnly ? "left-7" : "left-1")} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
