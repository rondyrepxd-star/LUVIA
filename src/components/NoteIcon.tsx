
"use client";

import React from 'react';
import { 
  FileText, Heart, Zap, Star, Shield, Anchor, Rocket,
  Book, Code, Globe, Music, GraduationCap, FlaskConical, Calculator, 
  Languages, Palette, Activity, Brain, Compass, Microscope, Hourglass,
  Library, Save, Notebook, NotebookPen, Moon, Sun, Coffee, PenTool, Folder
} from 'lucide-react';

interface NoteIconProps {
  iconName?: string;
  size?: number;
  className?: string;
}

const NoteIcon = ({ iconName = 'FileText', size = 16, className }: NoteIconProps) => {
  switch (iconName) {
    case 'Heart': return <Heart size={size} className={className} />;
    case 'Zap': return <Zap size={size} className={className} />;
    case 'Star': return <Star size={size} className={className} />;
    case 'Shield': return <Shield size={size} className={className} />;
    case 'Anchor': return <Anchor size={size} className={className} />;
    case 'Rocket': return <Rocket size={size} className={className} />;
    case 'Library': return <Library size={size} className={className} />;
    case 'Save': return <Save size={size} className={className} />;
    case 'Notebook': return <Notebook size={size} className={className} />;
    case 'NotebookPen': return <NotebookPen size={size} className={className} />;
    case 'Moon': return <Moon size={size} className={className} />;
    case 'Sun': return <Sun size={size} className={className} />;
    case 'Coffee': return <Coffee size={size} className={className} />;
    case 'PenTool': return <PenTool size={size} className={className} />;
    case 'Book': return <Book size={size} className={className} />;
    case 'Code': return <Code size={size} className={className} />;
    case 'Globe': return <Globe size={size} className={className} />;
    case 'Music': return <Music size={size} className={className} />;
    case 'GraduationCap': return <GraduationCap size={size} className={className} />;
    case 'FlaskConical': return <FlaskConical size={size} className={className} />;
    case 'Calculator': return <Calculator size={size} className={className} />;
    case 'Languages': return <Languages size={size} className={className} />;
    case 'Palette': return <Palette size={size} className={className} />;
    case 'Activity': return <Activity size={size} className={className} />;
    case 'Brain': return <Brain size={size} className={className} />;
    case 'Compass': return <Compass size={size} className={className} />;
    case 'Microscope': return <Microscope size={size} className={className} />;
    case 'Hourglass': return <Hourglass size={size} className={className} />;
    case 'Folder': return <Folder size={size} className={className} />;
    default: return <FileText size={size} className={className} />;
  }
};

export default NoteIcon;
