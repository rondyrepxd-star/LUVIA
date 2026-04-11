"use client";

import React from 'react';
import { Network, Search, Filter } from 'lucide-react';

const GraphView = () => {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => setIsClient(true), []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden text-left">
      <div className="absolute top-8 left-8 z-10 space-y-4">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Knowledge Graph</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" 
              placeholder="Filter nodes..." 
              className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-xl py-2 px-10 text-[10px] font-black uppercase italic outline-none focus:ring-1 focus:ring-primary/50 text-white"
            />
          </div>
          <button className="bg-white/[0.03] backdrop-blur-xl border border-white/5 p-2 rounded-xl hover:bg-white/5 transition-colors text-white/40"><Filter size={14} /></button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center opacity-40">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Decorative Graph Visualization */}
          <div className="absolute w-[600px] h-[600px] border border-primary/10 rounded-full animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-[400px] h-[400px] border border-accent/10 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
          <div className="absolute w-[800px] h-[800px] border border-white/5 rounded-full" />
          
          <Network size={120} className="text-primary animate-pulse" />
          
          {isClient && [...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]"
              style={{
                top: `${(i * 17) % 80 + 10}%`,
                left: `${(i * 23) % 80 + 10}%`,
                opacity: 0.3 + (i % 5) * 0.1
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 right-8 bg-card/80 backdrop-blur p-4 rounded-xl border border-border text-xs space-y-2">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Core Concepts</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Definitions</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/20" /> References</div>
      </div>
    </div>
  );
};

export default GraphView;