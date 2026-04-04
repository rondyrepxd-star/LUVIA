"use client";

import React from 'react';
import { Share2, Link as LinkIcon, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ConnectionsView = () => {
  const connections = [
    { title: 'Economics Overview', source: 'Internal', type: 'Prerequisite', strength: 'High' },
    { title: 'Market Trends 2024', source: 'External', type: 'Reference', strength: 'Medium' },
    { title: 'Macro Policy Notes', source: 'Internal', type: 'Related', strength: 'Low' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-16 px-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Share2 className="text-accent" />
          Topic Connections
        </h2>
        <p className="text-muted-foreground mt-2">Discover how this notebook relates to other materials in your library.</p>
      </div>

      <div className="grid gap-4">
        {connections.map((conn, i) => (
          <Card key={i} className="bg-card border-border hover:bg-muted/50 transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sidebar-accent rounded-lg flex items-center justify-center text-muted-foreground">
                  {conn.source === 'Internal' ? <FileText size={20} /> : <LinkIcon size={20} />}
                </div>
                <div>
                  <h4 className="font-bold">{conn.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="bg-sidebar-accent px-1.5 py-0.5 rounded text-primary">{conn.type}</span>
                    <span>•</span>
                    <span>Strength: {conn.strength}</span>
                  </div>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                <ExternalLink size={18} />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
          <Share2 size={32} />
        </div>
        <h3 className="text-xl font-bold">Discover New Connections</h3>
        <p className="text-muted-foreground max-w-md">Our AI can scan your entire library to find relevant links between your notes and external resources.</p>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-all active:scale-95">Run Scan</button>
      </div>
    </div>
  );
};

export default ConnectionsView;