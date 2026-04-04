"use client";

import React, { useState } from 'react';
import { X, Sparkles, CircleDot, Target, TextCursorInput, Pencil, ArrowRightLeft, ListOrdered, Columns2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (settings: any) => void;
}

const QuizModal = ({ isOpen, onClose, onGenerate }: QuizModalProps) => {
  const [numQuestions, setNumQuestions] = useState([10]);
  const [types, setTypes] = useState<string[]>(['multiple_choice', 'short_answer', 'matching', 'ordering', 'flashcard', 'reveal']);

  if (!isOpen) return null;

  const questionTypeOptions = [
    { id: 'multiple_choice', label: 'Multiple Choice', icon: <CircleDot className="h-4 w-4" /> },
    { id: 'true_false', label: 'True/False', icon: <Target className="h-4 w-4" /> },
    { id: 'fill_in_blank', label: 'Fill in Blank', icon: <TextCursorInput className="h-4 w-4" /> },
    { id: 'short_answer', label: 'Short Answer', icon: <Pencil className="h-4 w-4" /> },
    { id: 'matching', label: 'Matching', icon: <ArrowRightLeft className="h-4 w-4" /> },
    { id: 'ordering', label: 'Ordering', icon: <ListOrdered className="h-4 w-4" /> },
    { id: 'flashcard', label: 'Flashcard', icon: <Columns2 className="h-4 w-4" /> },
    { id: 'reveal', label: 'Reveal', icon: <Eye className="h-4 w-4" /> },
  ];

  const handleSelectAll = () => {
    setTypes(questionTypeOptions.map(t => t.id));
  };

  const handleClearAll = () => {
    setTypes([]);
  };

  const toggleType = (type: string) => {
    setTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b border-border flex items-center justify-between bg-sidebar-accent">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={20} />
            <h2 className="text-xl font-bold tracking-tight">AI Study Generator</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Number of items</Label>
              <span className="text-primary font-bold">{numQuestions[0]}</span>
            </div>
            <Slider 
              value={numQuestions} 
              onValueChange={setNumQuestions} 
              min={5} 
              max={30} 
              step={1} 
              className="py-4"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Content Types</Label>
              <div className="flex gap-2">
                <button 
                  onClick={handleSelectAll}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  Select All
                </button>
                <span className="text-muted-foreground text-[10px]">|</span>
                <button 
                  onClick={handleClearAll}
                  className="text-[10px] font-bold text-muted-foreground hover:text-foreground hover:underline uppercase tracking-wider"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {questionTypeOptions.map(type => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={type.id} 
                    checked={types.includes(type.id)} 
                    onCheckedChange={() => toggleType(type.id)} 
                  />
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleType(type.id)}>
                    <span className="text-muted-foreground">{type.icon}</span>
                    <Label htmlFor={type.id} className="cursor-pointer">{type.label}</Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-sidebar-accent border-t border-border flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            className="px-8 bg-primary hover:bg-primary/90" 
            disabled={types.length === 0}
            onClick={() => onGenerate({
              numberOfQuestions: numQuestions[0],
              questionTypes: types,
              difficulty: 'medium',
              includeExplanations: true,
              includeHints: true
            })}
          >
            Generate Study Set
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;