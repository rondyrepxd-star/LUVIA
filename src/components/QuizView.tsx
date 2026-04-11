"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, Plus, Pencil, Trash2, ArrowLeft, 
  CheckCircle, ChevronRight, X, 
  CircleDot, Target, TextCursorInput, 
  ListOrdered, Columns2, ArrowRightLeft,
  ShieldCheck, RotateCcw, Volume2,
  Pause, AlertTriangle, Layers, Sparkles as SparklesIcon,
  Zap,
  Trophy,
  Activity,
  VolumeX,
  Volume1,
  Upload,
  Eye,
  Music,
  Clock,
  Check,
  ChevronUp,
  ChevronDown,
  PlusCircle,
  Headphones,
  MoreVertical,
  SortAsc,
  SortDesc,
  Shuffle,
  AlertCircle,
  Lock,
  ListTodo,
  ToggleLeft,
  Type,
  RectangleEllipsis,
  BoxSelect,
  HelpCircle,
  ArrowRight,
  GripVertical
} from 'lucide-react';
import { GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RevealEffect = 'hacker' | 'typewriter' | 'blur' | 'elastic' | 'slide' | 'glow' | 'flip' | 'fade' | 'zoom' | 'bounce';
type QuizOrder = 'random' | 'sequential' | 'reverse';

interface ErrorEntry {
  id: string;
  question: any;
  userAnswer: any;
  timestamp: number;
}

interface QuestionPreset {
  name: string;
  indices: number[];
  isPrivate?: boolean;
  noteId?: string;
}

const PRESET_SONGS = [
  { id: 'lofi', name: 'LOFI STUDY', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'synth', name: 'SYNTHWAVE NEURAL', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'focus', name: 'DEEP CONCENTRATION', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'ambient', name: 'AMBIENT DATA', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
  { id: 'minimal', name: 'MINIMAL LOGIC', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
  { id: 'tictak1', name: 'RHYTHMIC RECALL (TIC-TAK)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 'tictak2', name: 'SYNAPTIC BEAT (TIC-TAK 2)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
];

const SFX = {
  correct: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  incorrect: 'https://actions.google.com/sounds/v1/alarms/notification_simple.ogg',
  trophy: 'https://actions.google.com/sounds/v1/celebration/horns_celebration.ogg',
  awesome: 'https://actions.google.com/sounds/v1/impacts/crash_cymbal.ogg',
  godlike: 'https://actions.google.com/sounds/v1/impacts/explosion_with_metal_shards.ogg',
};

const AnimatedWord = ({ text, effect }: { text: string, effect: RevealEffect }) => {
  const [displayText, setDisplayText] = useState('');
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

  useEffect(() => {
    if (effect === 'hacker') {
      let iteration = 0;
      const interval = setInterval(() => {
        setDisplayText(
          text.split("").map((letter, index) => {
            if (index < iteration) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join("")
        );
        if (iteration >= text.length) clearInterval(interval);
        iteration += 1 / 3;
      }, 30);
      return () => clearInterval(interval);
    } else if (effect === 'typewriter') {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setDisplayText(text);
    }
  }, [text, effect]);

  const getEffectClasses = () => {
    switch (effect) {
      case 'blur': return "animate-in fade-in blur-md duration-500 fill-mode-forwards";
      case 'elastic': return "animate-in zoom-in-50 duration-500 ease-out";
      case 'slide': return "animate-in slide-in-from-bottom-4 fade-in duration-300";
      case 'glow': return "animate-in fade-in duration-500 drop-shadow-[0_0_10px_rgba(153,128,229,0.8)]";
      case 'flip': return "animate-in slide-in-from-top-4 [transform:rotateX(90deg)] [animation:flip_0.5s_ease-out_forwards]";
      case 'fade': return "animate-in fade-in duration-1000";
      case 'zoom': return "animate-in zoom-in-125 fade-in duration-300";
      case 'bounce': return "animate-bounce duration-1000";
      default: return "";
    }
  };

  return (
    <span className={cn(
      "inline-block font-code",
      effect === 'hacker' ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "",
      getEffectClasses()
    )}>
      {displayText}
    </span>
  );
};

const QuizView = ({ 
  currentNoteId,
  noteContent, 
  quiz, 
  setQuiz,
  onExit,
  autoStart
}: { 
  currentNoteId: string,
  noteContent: string, 
  quiz: GenerateQuizOutput | null, 
  setQuiz: (quiz: GenerateQuizOutput | null) => void,
  onExit?: () => void,
  autoStart?: boolean
}) => {
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [showErrorReview, setShowErrorReview] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [dayErrors, setDayErrors] = useState<ErrorEntry[]>([]);
  
  const [isShowingPreview, setIsShowingPreview] = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState(0);
  const [revealedWords, setRevealedWords] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [currentSong, setCurrentSong] = useState(PRESET_SONGS[0]);
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  const [customMusicName, setCustomMusicName] = useState<string | null>(null);
  const customAudioInputRef = useRef<HTMLInputElement | null>(null);
  const [previewSeconds, setPreviewSeconds] = useState<number>(5);
  const [selectedRevealEffect, setSelectedRevealEffect] = useState<RevealEffect>('hacker');
  const [quizOrder, setQuizOrder] = useState<QuizOrder>('random');
  const [dynamicBlacklist, setDynamicBlacklist] = useState<string[]>([]);
  const [newBlacklistWord, setNewBlacklistWord] = useState('');
  const [showBlacklistPanel, setShowBlacklistPanel] = useState(false);
  const [matchingShuffledRight, setMatchingShuffledRight] = useState<any[]>([]);
  const [orderingShuffledItems, setOrderingShuffledItems] = useState<string[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHintExpanded, setIsHintExpanded] = useState(false);
  const [activePresetIndices, setActivePresetIndices] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const [correctStats, setCorrectStats] = useState(0);
  const [incorrectStats, setIncorrectStats] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [questionPresets, setQuestionPresets] = useState<QuestionPreset[]>([]);
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isPresetPrivate, setIsPresetPrivate] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [selectedLeftId, setSelectedLeftId] = useState<number | null>(null);
  const [blockingChars, setBlockingChars] = useState<string[]>([]);
  const [blockingSuccess, setBlockingSuccess] = useState(false);

  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isQuestionAudioPlaying, setIsQuestionAudioPlaying] = useState(false);

  const [editForm, setEditForm] = useState<any>({
    type: 'multiple_choice',
    question: '',
    correctAnswer: '',
    options: ['', '', '', ''],
    difficulty: 'medium',
    tags: [],
    hint: '',
    explanation: '',
    front: '',
    back: '',
    matchingPairs: [{ prompt: '', match: '' }],
    orderingSteps: ['', '', ''],
    acceptableAnswers: [],
    caseSensitive: false,
    audioUrl: '',
    independentPreviewSeconds: 5,
    variants: [],
    variantSelectionMode: 'random_1'
  });

  useEffect(() => {
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    if (currentQuestion?.type === 'blocking') {
      const word = currentQuestion.correctAnswer || '';
      // Ensure we don't shuffle into the correct order
      let shuffled = shuffleArray(word.split(''));
      while (shuffled.join('') === word && word.length > 1) {
        shuffled = shuffleArray(word.split(''));
      }
      setBlockingChars(shuffled);
      setBlockingSuccess(false);
      setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: shuffled.join('') }));
    }
  }, [currentQuestionIndex, sessionQuestions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreview = localStorage.getItem('cerebro_reveal_preview_seconds');
      if (savedPreview) setPreviewSeconds(parseInt(savedPreview, 10));
      const savedEffect = localStorage.getItem('cerebro_reveal_effect');
      if (savedEffect) setSelectedRevealEffect(savedEffect as RevealEffect);
      const savedBlacklist = localStorage.getItem('cerebro_blacklist');
      if (savedBlacklist) setDynamicBlacklist(JSON.parse(savedBlacklist));
      const savedOrder = localStorage.getItem('cerebro_quiz_order');
      if (savedOrder) setQuizOrder(savedOrder as QuizOrder);
      const savedMute = localStorage.getItem('cerebro_audio_mute');
      if (savedMute) setIsMuted(savedMute === 'true');

      const storedErrors = localStorage.getItem('luvia_day_errors');
      if (storedErrors) {
        const errors = JSON.parse(storedErrors) as ErrorEntry[];
        const today = new Date().setHours(0, 0, 0, 0);
        const filtered = errors.filter(e => new Date(e.timestamp).setHours(0, 0, 0, 0) === today);
        setDayErrors(filtered);
        localStorage.setItem('luvia_day_errors', JSON.stringify(filtered));
      }
      const storedPresets = localStorage.getItem('luvia_quiz_presets');
      if (storedPresets) setQuestionPresets(JSON.parse(storedPresets));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cerebro_blacklist', JSON.stringify(dynamicBlacklist));
  }, [dynamicBlacklist]);

  useEffect(() => {
    if (isQuizStarted && !showResults && !showErrorReview) {
      const audioUrl = customMusicUrl || currentSong.url;
      if (!bgAudioRef.current) {
        bgAudioRef.current = new Audio(audioUrl);
        bgAudioRef.current.loop = true;
      } else {
        if (bgAudioRef.current.src !== audioUrl) {
          bgAudioRef.current.src = audioUrl;
          bgAudioRef.current.load();
        }
      }
      bgAudioRef.current.muted = isMuted;
      
      if (isQuestionAudioPlaying) {
        bgAudioRef.current.pause();
      } else {
        bgAudioRef.current.play().catch(e => console.log("Music blocked", e));
      }
    } else {
      if (bgAudioRef.current) bgAudioRef.current.pause();
    }
    return () => { if (bgAudioRef.current) bgAudioRef.current.pause(); };
  }, [isQuizStarted, showResults, showErrorReview, currentSong, customMusicUrl, isMuted, isQuestionAudioPlaying]);

  useEffect(() => {
    if (!isEditModalOpen && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setIsPreviewPlaying(false);
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    if (isQuizStarted && !showResults && !showErrorReview && sessionQuestions[currentQuestionIndex]) {
      const q = sessionQuestions[currentQuestionIndex];
      
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
        questionAudioRef.current = null;
      }
      setIsQuestionAudioPlaying(false);

      if (q.type === 'reveal') {
        const duration = q.independentPreviewSeconds || previewSeconds;
        setIsShowingPreview(true);
        setPreviewCountdown(duration);
        setRevealedWords(0);

        const timer = setInterval(() => {
          setPreviewCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsShowingPreview(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        if (q.audioUrl) {
          questionAudioRef.current = new Audio(q.audioUrl);
          questionAudioRef.current.onended = () => setIsQuestionAudioPlaying(false);
          questionAudioRef.current.play().catch(e => console.log("Audio failed", e));
          setIsQuestionAudioPlaying(true);
        }

        return () => clearInterval(timer);
      }
    }
  }, [currentQuestionIndex, isQuizStarted, showResults, showErrorReview, sessionQuestions, previewSeconds]);

  useEffect(() => {
    if (isQuizStarted && !showResults && !showErrorReview) {
      const timer = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isQuizStarted, showResults, showErrorReview, sessionStartTime]);

  const cleanText = (text: string) => {
    if (!text) return "";
    let cleaned = text;
    dynamicBlacklist.forEach(word => {
      if (!word || !word.trim()) return;
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    return cleaned;
  };

  const handleQuestionChange = (val: string) => {
    const cleaned = cleanText(val);
    
    if (editForm.type === 'multiple_choice') {
      const mcPattern = /([^]*?)\n\s*[Aa][\.\)]\s*([^]*?)\n\s*[Bb][\.\)]\s*([^]*?)\n\s*[Cc][\.\)]\s*([^]*?)\n\s*[Dd][\.\)]\s*([^]*?)$/;
      const match = cleaned.match(mcPattern);
      
      if (match) {
        const questionText = match[1].trim();
        const rawOpts = [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()];
        
        let correctVal = editForm.correctAnswer;
        const cleanedOpts = rawOpts.map(opt => {
          if (opt.toLowerCase().includes("correct answer")) {
            const cleanOpt = opt.replace(/\s*[\(\[]?correct answer[\)\]]?\s*/gi, "").trim();
            correctVal = cleanOpt;
            return cleanOpt;
          }
          return opt;
        });

        setEditForm({
          ...editForm,
          question: questionText,
          options: cleanedOpts,
          correctAnswer: correctVal
        });

        toast({
          title: "ImportaciÃ³n Inteligente",
          description: "Estructura de pregunta detectada y organizada.",
        });
        return;
      }
    } else if (editForm.type === 'fill_in_blank') {
      const firstMarkerIndex = cleaned.indexOf('1) ');
      if (firstMarkerIndex !== -1) {
        const questionText = cleaned.substring(0, firstMarkerIndex).trim();
        const answersPart = cleaned.substring(firstMarkerIndex);
        
        const answers: string[] = [];
        const answerRegex = /(\d+)\)\s+([^]*?)(?=\n\s*\d+\)|$)/gi;
        let answerMatch;
        while ((answerMatch = answerRegex.exec(answersPart)) !== null) {
          const index = parseInt(answerMatch[1], 10) - 1;
          if (index >= 0) {
            answers[index] = answerMatch[2].trim();
          }
        }

        if (answers.length > 0) {
          setEditForm({
            ...editForm,
            question: questionText,
            acceptableAnswers: answers
          });
          toast({
            title: "ImportaciÃ³n Inteligente",
            description: `${answers.length} respuestas organizadas automÃ¡ticamente.`,
          });
          return;
        }
      }
    }
    
    setEditForm({ ...editForm, question: cleaned });
  };

  useEffect(() => {
    if (dynamicBlacklist.length > 0) {
      setEditForm((prev: any) => ({
        ...prev,
        question: cleanText(prev.question),
        options: (prev.options || []).map((o: string) => cleanText(o)),
        correctAnswer: cleanText(prev.correctAnswer),
        front: cleanText(prev.front),
        back: cleanText(prev.back)
      }));
    }
  }, [dynamicBlacklist]);

  const playSFX = (type: keyof typeof SFX) => {
    if (isMuted) return;
    const audio = new Audio(SFX[type]);
    audio.play().catch(e => console.log("SFX blocked", e));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCustomAudioUpload = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please upload a valid audio file (MP3, OGG, WAV, etc.).' });
      return;
    }
    // Revoke previous custom URL to free memory
    if (customMusicUrl && customMusicUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customMusicUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setCustomMusicUrl(blobUrl);
    setCustomMusicName(file.name.replace(/\.[^.]+$/, ''));  // strip extension
    toast({ title: 'ðŸŽµ Track Loaded', description: `"${file.name}" added to loop.` });
  };

  const handleDeleteCustomAudio = () => {
    if (customMusicUrl && customMusicUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customMusicUrl);
    }
    setCustomMusicUrl(null);
    setCustomMusicName(null);
    if (customAudioInputRef.current) customAudioInputRef.current.value = '';
  };

  const handleStartQuiz = () => {
    if (!quiz || quiz.quiz.length === 0) {
      toast({ variant: "destructive", title: "NO ITEMS", description: "PLEASE GENERATE QUESTIONS FIRST." });
      return;
    }
    
    let baseQuestions = (quiz?.quiz || []).map((q, idx) => ({ ...q, originalIndex: idx }));
    if (selectedIndices.size > 0) {
      baseQuestions = baseQuestions.filter((_, idx) => selectedIndices.has(idx));
    }

    let sessionSet: any[] = [];
    
    baseQuestions.forEach(q => {
      const versions = [q, ...(q.variants || [])];
      
      if (compareMode) {
        // Global Comparative Mode: Add all versions
        versions.forEach(v => sessionSet.push({ ...v, originalIndex: q.originalIndex }));
      } else {
        // Per-question Selection Mode
        const mode = q.variantSelectionMode || 'random_1';
        
        if (mode === 'all') {
          versions.forEach(v => sessionSet.push({ ...v, originalIndex: q.originalIndex }));
        } else if (mode === 'random_2' && versions.length >= 3) {
          const shuffled = shuffleArray(versions);
          shuffled.slice(0, 2).forEach(v => sessionSet.push({ ...v, originalIndex: q.originalIndex }));
        } else {
          // Default: Pick 1 random (handles random_1 and random_2 if count < 3)
          const chosen = versions[Math.floor(Math.random() * versions.length)];
          sessionSet.push({ ...chosen, originalIndex: q.originalIndex });
        }
      }
    });

    if (quizOrder === 'random') sessionSet = shuffleArray(sessionSet);
    else if (quizOrder === 'reverse') sessionSet = sessionSet.reverse();

    sessionSet = sessionSet.map(q => {
      if (q.type === 'multiple_choice' && q.options) return { ...q, options: shuffleArray(q.options) };
      return q;
    });

    setSessionQuestions(sessionSet);
    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setHasVerified(false);
    setRevealedWords(0);
    setIsShowingPreview(false);
    setSessionStartTime(Date.now());
    setCurrentTime(0);
    setCorrectStats(0);
    setIncorrectStats(0);
    setCurrentStreak(0);
    setIsQuestionAudioPlaying(false);
    setShowResults(false);
    setShowErrorReview(false);
  };

  useEffect(() => {
    if (autoStart && quiz && quiz.quiz.length > 0 && !isQuizStarted) {
      handleStartQuiz();
    }
  }, [autoStart, quiz, isQuizStarted]);

  useEffect(() => {
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    if (currentQuestion?.type === 'matching' && currentQuestion.matchingPairs) {
      setMatchingShuffledRight(shuffleArray(currentQuestion.matchingPairs));
    }
    if (currentQuestion?.type === 'ordering' && currentQuestion.orderingSteps) {
      const shuffled = shuffleArray(currentQuestion.orderingSteps);
      setOrderingShuffledItems(shuffled);
      // Initialize answer with shuffled items to allow drag/drop reordering
      if (!userAnswers[currentQuestionIndex]) {
        setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: shuffled }));
      }
    }
    setSelectedLeftId(null);
  }, [currentQuestionIndex, sessionQuestions]);

  const handleStartErrorQuiz = () => {
    if (dayErrors.length === 0) return;
    
    const errorQuestions = dayErrors.map(e => ({ 
      ...e.question, 
      isErrorRetry: true,
      errorEntryId: e.id 
    }));
    setSessionQuestions(errorQuestions);
    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setHasVerified(false);
    setRevealedWords(0);
    setIsShowingPreview(false);
    setSessionStartTime(Date.now());
    setCurrentTime(0);
    setCorrectStats(0);
    setIncorrectStats(0);
    setCurrentStreak(0);
    setIsQuestionAudioPlaying(false);
    setShowResults(false);
    setShowErrorReview(false);
    
    toast({
      title: "SesiÃ³n de Refuerzo",
      description: `Repasando ${errorQuestions.length} fallos del dÃ­a.`,
    });
  };

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const isCorrect = (q: any, answer: any) => {
    if (q.type === 'flashcard' || q.type === 'reveal') return true;
    if (answer === undefined || answer === null) return false;
    const normalize = (s: any) => q.caseSensitive ? String(s || '').trim() : String(s || '').trim().toLowerCase();
    
    switch (q.type) {
      case 'multiple_choice':
      case 'true_false':
      case 'blocking':
        return normalize(answer) === normalize(q.correctAnswer);
      case 'short_answer':
        const primaryMatch = normalize(answer) === normalize(q.correctAnswer);
        const altMatch = q.acceptableAnswers?.some((alt: string) => normalize(alt) === normalize(answer));
        return primaryMatch || altMatch;
      case 'fill_in_blank':
        const userArray = Array.isArray(answer) ? answer : [answer];
        const correctArray = (q.acceptableAnswers && q.acceptableAnswers.length > 0) ? q.acceptableAnswers : [q.correctAnswer];
        if (userArray.length !== correctArray.length) return false;
        return correctArray.every((correctItem: string, idx: number) => normalize(userArray[idx]) === normalize(correctItem));
      case 'ordering':
        return JSON.stringify(answer) === JSON.stringify(q.orderingSteps);
      case 'matching':
        const userMatchesObj = (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) ? answer : {};
        if (Object.keys(userMatchesObj).length !== (q.matchingPairs?.length || 0)) return false;
        return q.matchingPairs.every((p: any, i: number) => {
          return userMatchesObj[i] === p.match;
        });
      default:
        return false;
    }
  };

  const logError = (q: any, answer: any) => {
    const newError: ErrorEntry = {
      id: Math.random().toString(36).substring(2, 9),
      question: { ...q },
      userAnswer: answer,
      timestamp: Date.now()
    };
    const updated = [newError, ...dayErrors];
    setDayErrors(updated);
    localStorage.setItem('luvia_day_errors', JSON.stringify(updated));
  };

  const handleVerify = () => {
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    const answer = userAnswers[currentQuestionIndex];
    const correct = isCorrect(currentQuestion, answer);
    
    setHasVerified(true);
    if (correct) {
      setCorrectStats(prev => prev + 1);
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      playSFX('correct');
      if (newStreak === 3) { setStreakMessage("AWESOME"); playSFX('awesome'); setTimeout(() => setStreakMessage(null), 2000); }
      else if (newStreak === 8) { setStreakMessage("GODLIKE"); playSFX('godlike'); setTimeout(() => setStreakMessage(null), 3000); }
      
      if (currentQuestion.isErrorRetry && currentQuestion.errorEntryId) {
        setDayErrors(prev => {
          const updated = prev.filter(e => e.id !== currentQuestion.errorEntryId);
          localStorage.setItem('luvia_day_errors', JSON.stringify(updated));
          return updated;
        });
      }
    } else {
      setIncorrectStats(prev => prev + 1);
      setCurrentStreak(0);
      playSFX('incorrect');
      if (!currentQuestion.isErrorRetry) {
        logError(currentQuestion, answer);
      }
    }
  };

  const handleNext = () => {
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    const answer = userAnswers[currentQuestionIndex];
    let updatedQuestions = [...sessionQuestions];
    
    if (!isCorrect(currentQuestion, answer) && !['flashcard', 'reveal'].includes(currentQuestion.type)) {
      const retryQuestion = { ...currentQuestion, isRetry: true };
      
      // Shuffle options for multiple choice retry
      if (retryQuestion.type === 'multiple_choice' && retryQuestion.options) {
        retryQuestion.options = shuffleArray(retryQuestion.options);
      }

      const remainingCount = updatedQuestions.length - (currentQuestionIndex + 1);
      const insertIndex = remainingCount > 0 ? Math.floor(Math.random() * remainingCount) + currentQuestionIndex + 1 : updatedQuestions.length;
      updatedQuestions.splice(insertIndex, 0, retryQuestion);
      setSessionQuestions(updatedQuestions);
    }

    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current = null;
    }
    setIsQuestionAudioPlaying(false);
    setIsFlipped(false);
    setRevealedWords(0);
    setIsShowingPreview(false);
    setHintRevealed(false);
    setSelectedLeftId(null);
    
    if (currentQuestionIndex === (updatedQuestions.length - 1)) {
      setShowResults(true);
      playSFX('trophy');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setHasVerified(false);
    }
  };

  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (!isQuizStarted || showResults || showErrorReview || isEditModalOpen) return;
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    if (currentQuestion.type === 'reveal' && !isShowingPreview) {
      const revealWordsArray = currentQuestion.correctAnswer?.split(/\s+/) || [];
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setRevealedWords(prev => Math.min(prev + 1, revealWordsArray.length));
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setRevealedWords(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setRevealedWords(0);
        return;
      }
    }

    if (e.key === 'Enter') {
      if (!hasVerified && !['flashcard', 'reveal'].includes(currentQuestion.type)) {
        if (userAnswers[currentQuestionIndex]) handleVerify();
      } else if (hasVerified || ['flashcard', 'reveal'].includes(currentQuestion.type)) {
        const revealWordsArray = currentQuestion.correctAnswer?.split(/\s+/) || [];
        const isRevealComplete = revealedWords >= revealWordsArray.length;
        const canProceed = !((currentQuestion.type === 'reveal' && !isRevealComplete && !isShowingPreview) || (currentQuestion.type === 'reveal' && isShowingPreview));
        if (canProceed) handleNext();
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isQuizStarted, showResults, showErrorReview, currentQuestionIndex, hasVerified, userAnswers, sessionQuestions, revealedWords, isShowingPreview, isEditModalOpen]);

  const toggleQuestionSelection = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'multiple_choice': return <ListTodo size={14} />;
      case 'true_false': return <ToggleLeft size={14} />;
      case 'short_answer': return <Type size={14} />;
      case 'fill_in_blank': return <RectangleEllipsis size={14} />;
      case 'matching': return <Activity size={14} />;
      case 'ordering': return <Layers size={14} />;
      case 'flashcard': return <RotateCcw size={14} />;
      case 'reveal': return <Eye size={14} />;
      case 'blocking': return <BoxSelect size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  const openEditModal = (index: number | null) => {
    setEditingIndex(index);
    setShowBlacklistPanel(false);
    if (index !== null && quiz) {
      const q = quiz.quiz[index] as any;
      setEditForm({ 
        ...q, 
        options: q.options || ['', '', '', ''],
        tags: q.tags || [],
        matchingPairs: q.matchingPairs || [{ prompt: '', match: '' }],
        orderingSteps: q.orderingSteps || ['', '', ''],
        acceptableAnswers: q.acceptableAnswers || [],
        caseSensitive: q.caseSensitive || false,
        audioUrl: q.audioUrl || '',
        independentPreviewSeconds: q.independentPreviewSeconds || 5,
        variants: q.variants || [],
        variantSelectionMode: q.variantSelectionMode || 'random_1'
      });
    } else {
      setEditForm({
        type: 'multiple_choice',
        question: '',
        correctAnswer: '',
        options: ['', '', '', ''],
        difficulty: 'medium',
        tags: [],
        hint: '',
        explanation: '',
        front: '',
        back: '',
        matchingPairs: [{ prompt: '', match: '' }],
        orderingSteps: ['', '', ''],
        acceptableAnswers: [],
        caseSensitive: false,
        audioUrl: '',
        independentPreviewSeconds: 5
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveQuestion = () => {
    const newQuestions = [...(quiz?.quiz || [])];
    if (editingIndex !== null) newQuestions[editingIndex] = editForm;
    else newQuestions.push(editForm);
    setQuiz({ quiz: newQuestions });
    setIsEditModalOpen(false);
  };

  const handleSortLibrary = (type: 'asc' | 'desc' | 'random') => {
    if (!quiz) return;
    let newItems = [...quiz.quiz];
    if (type === 'asc') {
      newItems.sort((a, b) => {
        const textA = a.type === 'flashcard' ? a.front || '' : a.question || '';
        const textB = b.type === 'flashcard' ? b.front || '' : b.question || '';
        return textA.localeCompare(textB);
      });
    } else if (type === 'desc') {
      newItems.sort((a, b) => {
        const textA = a.type === 'flashcard' ? a.front || '' : a.question || '';
        const textB = b.type === 'flashcard' ? b.front || '' : b.question || '';
        return textB.localeCompare(textA);
      });
    } else {
      newItems = shuffleArray(newItems);
    }
    setQuiz({ ...quiz, quiz: newItems });
    toast({ title: "Biblioteca organizada", description: `Orden: ${type === 'asc' ? 'A-Z' : type === 'desc' ? 'Z-A' : 'Aleatorio'}` });
  };

  const savePreset = () => {
    if (!newPresetName.trim() || selectedIndices.size === 0) return;
    const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    const newPreset: QuestionPreset = {
      name: newPresetName.trim().toUpperCase(),
      indices: sortedIndices,
      isPrivate: isPresetPrivate,
      noteId: isPresetPrivate ? currentNoteId : undefined
    };

    let updated;
    if (editingPresetIndex !== null) {
      updated = [...questionPresets];
      updated[editingPresetIndex] = newPreset;
    } else {
      updated = [...questionPresets, newPreset];
    }
    
    setQuestionPresets(updated);
    localStorage.setItem('luvia_quiz_presets', JSON.stringify(updated));
    setNewPresetName('');
    setIsPresetPrivate(false);
    setEditingPresetIndex(null);
    setIsSavePresetDialogOpen(false);
    toast({ title: isPresetPrivate ? "SelecciÃ³n Individual Guardada" : "SelecciÃ³n Global Guardada", description: `Se ha guardado el preset: ${newPreset.name}` });
  };

  const deletePreset = (index: number) => {
    const updated = questionPresets.filter((_, i) => i !== index);
    setQuestionPresets(updated);
    localStorage.setItem('luvia_quiz_presets', JSON.stringify(updated));
    toast({ title: "Preset Eliminado" });
  };

  const applyPreset = (indices: number[]) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      const allIncluded = indices.every(idx => next.has(idx));
      
      if (allIncluded) {
        // Toggle off if everything in the preset is already selected
        indices.forEach(idx => next.delete(idx));
        toast({ title: "SelecciÃ³n Removida" });
      } else {
        // Add indices (additive)
        indices.forEach(idx => next.add(idx));
        toast({ title: "Preset AÃ±adido", description: `${indices.length} preguntas aÃ±adidas.` });
      }
      return next;
    });
  };

  const detectedBlanksCount = useMemo(() => {
    if (editForm.type !== 'fill_in_blank') return 0;
    return (editForm.question.match(/\(BLACK\)/g) || []).length;
  }, [editForm.question, editForm.type]);

  const toggleQuestionAudio = () => {
    if (!questionAudioRef.current) return;
    
    if (isQuestionAudioPlaying) {
      questionAudioRef.current.pause();
      setIsQuestionAudioPlaying(false);
    } else {
      questionAudioRef.current.play().catch(e => console.log("Play failed", e));
      setIsQuestionAudioPlaying(true);
    }
  };

  const renderErrorReview = () => {
    return (
      <div className="flex flex-col h-full bg-[#080a0c] animate-in fade-in duration-500">
        <div className="sticky top-0 z-40 bg-[#161616]/80 backdrop-blur-2xl border-b border-white/5 px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setShowErrorReview(false); setShowResults(true); }}
              className="gap-2 font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white"
            >
              <ArrowLeft size={14} /> VOLVER
            </Button>
            <div className="h-6 w-px bg-white/5" />
            <h2 className="text-xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
              <AlertCircle size={20} className="text-destructive" />
              REVISIÃ“N DE ERRORES DEL DÃA
            </h2>
          </div>
          <Button 
            onClick={handleStartErrorQuiz}
            className="bg-destructive hover:bg-destructive/90 text-white font-black px-4 h-8 rounded-full italic uppercase text-[10px] shadow-lg shadow-destructive/20 transition-all active:scale-95"
          >
            Fallos Registrados {dayErrors.length}
          </Button>
        </div>

        <ScrollArea className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {dayErrors.length === 0 ? (
              <div className="py-32 text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <CheckCircle size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Â¡IMPECABLE!</h3>
                  <p className="text-white/40 font-medium italic mt-2">No has cometido errores hoy. Tu precisiÃ³n es absoluta.</p>
                </div>
                <Button onClick={() => { setShowErrorReview(false); setIsQuizStarted(false); }} className="bg-primary px-8 h-12 rounded-xl font-black uppercase italic tracking-widest text-xs">VOLVER AL INICIO</Button>
              </div>
            ) : (
              dayErrors.map((error, idx) => (
                <Card key={error.id} className="bg-[#111]/50 border-white/5 rounded-[1.5rem] overflow-hidden border-2 hover:border-white/10 transition-all group">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 font-black italic text-xs">
                          {idx + 1}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">{error.question.type.replace('_', ' ')}</span>
                      </div>
                      <Badge variant="outline" className="border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20 italic">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-white/90 leading-tight">
                      {error.question.question || error.question.front}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-destructive/60 italic">TU RESPUESTA:</p>
                        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive font-black text-xs uppercase italic truncate">
                          {Array.isArray(error.userAnswer) ? error.userAnswer.join(', ') : (error.userAnswer || 'SIN RESPUESTA')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-green-500/60 italic">RESPUESTA CORRECTA:</p>
                        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-green-500 font-black text-xs uppercase italic truncate">
                          {error.question.correctAnswer || error.question.back || (error.question.acceptableAnswers && error.question.acceptableAnswers.join(', ')) || 'VER DETALLE'}
                        </div>
                      </div>
                    </div>

                    {error.question.explanation && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 italic mb-2">EXPLICACIÃ“N COGNITIVA:</p>
                        <p className="text-sm text-white/50 leading-relaxed italic">{error.question.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderQuizContent = () => {
    if (isGenerating) return (
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h2 className="text-lg font-black uppercase italic tracking-tighter">GENERATING STUDY SET...</h2>
      </div>
    );

    if (showErrorReview) return renderErrorReview();

    if (isQuizStarted && !showResults && sessionQuestions.length > 0) {
      const currentQuestion = sessionQuestions[currentQuestionIndex];
      const revealWordsArray = currentQuestion.correctAnswer?.split(/\s+/) || [];
      const isRevealComplete = revealedWords >= revealWordsArray.length;

      return (
        <div className="flex flex-col h-full bg-background/95 backdrop-blur-3xl relative animate-in fade-in duration-500 overflow-hidden text-left">
          {streakMessage && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-none animate-in zoom-in-150 duration-500">
              <div className={cn(
                "font-black text-9xl italic tracking-tighter drop-shadow-[0_0_50px_rgba(var(--primary),0.8)] animate-pulse",
                streakMessage === 'AWESOME' ? "text-primary" : "text-accent scale-125"
              )}>
                {streakMessage}
              </div>
            </div>
          )}

          <div className="sticky top-0 z-40 bg-[#161616]/80 backdrop-blur-2xl border-b border-white/5 px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" onClick={() => { 
                if (onExit) onExit();
                else setIsQuizStarted(false); 
              }} className="gap-2 font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white">
                <ArrowLeft size={14} /> EXIT
              </Button>
              <div className="h-6 w-px bg-white/5" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">ACCURACY:</span>
                  <span className="text-sm font-black text-primary italic">
                    {correctStats + incorrectStats === 0 ? '100%' : `${Math.round((correctStats / (correctStats + incorrectStats)) * 100)}%`}
                  </span>
                </div>
                {currentQuestion.isErrorRetry && (
                  <div className="px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-full animate-in fade-in zoom-in-95">
                    <span className="text-[10px] font-black text-destructive uppercase italic tracking-widest">Quiz de Fallos Registrado</span>
                  </div>
                )}
                {currentStreak > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 animate-pulse">
                    <Zap size={14} className="text-primary" />
                    <span className="text-xs font-black text-primary italic">{currentStreak} STREAK</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                    {isMuted ? <VolumeX size={16} /> : <Volume1 size={16} />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-[#161616] border-white/10 p-4 rounded-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-10px font-black uppercase tracking-widest text-white/30 italic">AUDIO SYSTEM</span>
                      <Switch checked={!isMuted} onCheckedChange={(val) => {
                        setIsMuted(!val);
                        localStorage.setItem('cerebro_audio_mute', String(!val));
                      }} />
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">NEURAL TRACK</Label>
                      <div className="grid gap-1">
                        {PRESET_SONGS.map(song => (
                          <button
                            key={song.id}
                            onClick={() => { setCurrentSong(song); setCustomMusicUrl(null); setCustomMusicName(null); }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all",
                              currentSong.id === song.id && !customMusicUrl ? "bg-primary/20 text-primary" : "text-white/40 hover:bg-white/5"
                            )}
                          >
                            <Music size={12} />
                            <span className="text-[10px] font-black uppercase italic truncate">{song.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Audio Upload */}
                    <div className="h-px bg-white/5" />
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">MY AUDIO</Label>
                      
                      <input
                        ref={customAudioInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCustomAudioUpload(file);
                        }}
                      />

                      {customMusicUrl ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/15 border border-primary/30 rounded-xl">
                          <Music size={12} className="text-primary shrink-0 animate-pulse" />
                          <span className="text-[10px] font-black uppercase italic truncate flex-1 text-primary">{customMusicName || 'Custom Track'}</span>
                          <button
                            onClick={handleDeleteCustomAudio}
                            className="p-1 hover:bg-destructive/20 hover:text-destructive text-white/40 rounded-md transition-colors shrink-0"
                            title="Remove custom audio"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => customAudioInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 rounded-xl text-white/30 hover:text-primary transition-all"
                        >
                          <Upload size={12} />
                          <span className="text-[10px] font-black uppercase italic">Upload Audio File</span>
                        </button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-accent" />
                <span className="text-sm font-black text-accent italic">{formatDuration(currentTime)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic">PROGRESSION</span>
                <span className="text-sm font-black text-white italic">{currentQuestionIndex + 1} / {sessionQuestions.length}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <Progress value={((currentQuestionIndex + 1) / sessionQuestions.length) * 100} className="h-1 bg-white/5" />
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 border-primary/20 bg-primary/10 text-primary rounded-xl italic">
                  {currentQuestion.difficulty}
                </Badge>
                <div className="flex items-center gap-4">
                  {currentQuestion.audioUrl && <Headphones size={14} className="text-primary animate-pulse" />}
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">{currentQuestion.type}</span>
                </div>
              </div>

              <Card className="bg-[#111]/50 backdrop-blur-3xl border-white/5 rounded-[2rem] overflow-hidden shadow-2xl border-2">
                <CardContent className="p-10">
                  {/* NEED HINT BUTTON */}
                  {!hasVerified && currentQuestion.hint && !['flashcard', 'reveal'].includes(currentQuestion.type) && (
                    <div className="flex justify-end mb-6">
                      {hintRevealed ? (
                        <div 
                          onClick={() => setHintRevealed(false)}
                          className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-4 animate-in slide-in-from-right-4 duration-500 max-w-sm cursor-pointer hover:bg-primary/10 transition-colors"
                        >
                          <SparklesIcon size={18} className="text-primary shrink-0 mt-0.5" />
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-primary tracking-widest block mb-1">hint:</span>
                            <p className="text-xs font-medium text-white/70 italic leading-relaxed">{currentQuestion.hint}</p>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setHintRevealed(true)}
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-4 rounded-lg bg-primary/5 border-primary/20 text-primary hover:bg-primary/20 font-black text-[9px] uppercase italic tracking-widest gap-2"
                        >
                          <AlertCircle size={14} /> Need a hint?
                        </Button>
                      )}
                    </div>
                  )}

                  {currentQuestion.type === 'flashcard' ? (
                    <div className="perspective-1000 min-h-[300px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                      <div className={cn("relative w-full h-full transition-transform duration-700 preserve-3d text-center py-16", isFlipped && "rotate-y-180")}>
                        <div className={cn("backface-hidden w-full", isFlipped ? "hidden" : "block")}>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 mb-8 italic">COGNITIVE FRONT</p>
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-tight text-white">{currentQuestion.front}</h3>
                        </div>
                        <div className={cn("backface-hidden w-full rotate-y-180", isFlipped ? "block" : "hidden")}>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/40 mb-8 italic">RETRIEVED DATA</p>
                          <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-tight text-accent">{currentQuestion.back}</h3>
                        </div>
                      </div>
                    </div>
                  ) : currentQuestion.type === 'reveal' ? (
                    <div className="min-h-[300px] flex flex-col items-center justify-center space-y-10">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-4">
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{currentQuestion.question}</h3>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => openEditModal(currentQuestion.originalIndex ?? null)}
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white"
                            >
                              <Pencil size={18} />
                            </Button>
                            {currentQuestion.audioUrl && (
                              <Button 
                                onClick={toggleQuestionAudio}
                                className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                  isQuestionAudioPlaying ? "bg-primary text-primary-foreground scale-110 shadow-[0_0_20px_rgba(var(--primary),0.4)]" : "bg-white/5 text-white/40 hover:bg-white/10"
                                )}
                              >
                                {isQuestionAudioPlaying ? <Pause size={20} fill="currentColor" /> : <Volume2 size={20} />}
                              </Button>
                            )}
                          </div>
                        </div>
                        {isShowingPreview && (
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">PREVIEW MODE: {previewCountdown}s</p>
                        )}
                      </div>
                      
                      <div className="w-full max-w-2xl p-8 rounded-[1.5rem] border-2 border-dashed border-primary/20 bg-primary/5 min-h-[120px] flex items-center justify-center relative">
                        <p className="text-xl font-black uppercase italic tracking-tighter flex flex-wrap justify-center gap-x-3 gap-y-3">
                          {isShowingPreview ? currentQuestion.correctAnswer : (
                            revealedWords === 0 ? (
                              <span className="text-white/10 uppercase tracking-[0.2em] text-sm font-bold">Use Arrow Keys to reveal content</span>
                            ) : (
                              revealWordsArray.slice(0, revealedWords).map((word: string, idx: number) => (
                                <AnimatedWord key={idx} text={word} effect={selectedRevealEffect} />
                              ))
                            )
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-6">
                        {!isRevealComplete && !isShowingPreview ? (
                          <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setRevealedWords(prev => Math.max(0, prev - 1))} className="border-white/5 text-white/40 hover:text-white px-6 rounded-xl">BACK</Button>
                            <Button onClick={() => setRevealedWords(prev => Math.min(revealWordsArray.length, prev + 1))} className="bg-primary font-black uppercase italic tracking-widest px-8 rounded-xl h-12 shadow-2xl">REVEAL NEXT</Button>
                            <Button variant="outline" onClick={() => setRevealedWords(0)} className="border-white/5 text-white/40 hover:text-white px-6 rounded-xl">RESET</Button>
                          </div>
                        ) : isRevealComplete && (
                          <div className="flex flex-col items-center gap-2 animate-in zoom-in-75 duration-500">
                            <CheckCircle size={32} className="text-green-500" />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-500 italic">SYNC COMPLETE</p>
                          </div>
                        )}
                        <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-widest text-white/10 italic">
                          <span className="flex items-center gap-2"><ArrowRightLeft size={10} className="rotate-90" /> RIGHT to Reveal</span>
                          <span className="flex items-center gap-2"><ArrowRightLeft size={10} className="-rotate-90" /> LEFT to Back</span>
                          <span className="flex items-center gap-2"><ChevronDown size={10} /> DOWN to Reset</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-2xl font-black leading-tight tracking-tighter uppercase italic text-left text-white/90">
                          {currentQuestion.type === 'fill_in_blank' ? "COMPLETE THE NEURAL SEQUENCE:" : (currentQuestion.question || "PROCESS THIS INPUT:")}
                        </h3>
                        <Button 
                          onClick={() => openEditModal(currentQuestion.originalIndex ?? null)}
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white"
                        >
                          <Pencil size={18} />
                        </Button>
                      </div>

                      {currentQuestion.type === 'multiple_choice' && (
                        <div className="grid gap-3">
                          {currentQuestion.options?.map((opt: string, i: number) => {
                            const isSelected = userAnswers[currentQuestionIndex] === opt;
                            const isCorrectOpt = opt === currentQuestion.correctAnswer;
                            return (
                              <button
                                key={i}
                                disabled={hasVerified}
                                onClick={() => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: opt })}
                                className={cn(
                                  "w-full text-left p-4 rounded-[1.2rem] border-2 transition-all flex items-center justify-between h-14",
                                  isSelected 
                                    ? (hasVerified ? (isCorrectOpt ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10") : "border-primary bg-primary/10")
                                    : (hasVerified && isCorrectOpt ? "border-green-500/50 bg-green-500/5" : "border-white/5 bg-white/[0.02] hover:border-white/20")
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-[11px] transition-all border", isSelected ? "bg-white text-black border-transparent" : "bg-white/5 text-white/20 border-white/5")}>
                                    {String.fromCharCode(65 + i)}
                                  </div>
                                  <span className="font-black text-xs uppercase tracking-tight text-white/80">{opt}</span>
                                </div>
                                {hasVerified && isCorrectOpt && <CheckCircle size={20} className="text-green-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {currentQuestion.type === 'true_false' && (
                        <div className="grid grid-cols-2 gap-6">
                          {['True', 'False'].map((opt) => (
                            <button
                              key={opt}
                              disabled={hasVerified}
                              onClick={() => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: opt })}
                              className={cn(
                                "h-28 rounded-[2rem] border-2 transition-all font-black text-2xl uppercase tracking-widest italic shadow-xl",
                                userAnswers[currentQuestionIndex] === opt 
                                  ? (hasVerified ? (opt === currentQuestion.correctAnswer ? "border-green-500 bg-green-500/10 text-green-500" : "border-destructive bg-destructive/10 text-destructive") : "border-primary bg-primary/10 text-primary scale-105")
                                  : "border-white/5 text-white/20 hover:border-white/10"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {currentQuestion.type === 'fill_in_blank' && (
                        <div className="text-left space-y-8">
                          <div className="text-xl font-black leading-relaxed tracking-tighter uppercase italic flex flex-wrap items-baseline gap-x-3 gap-y-4 text-white/80">
                            {currentQuestion.question?.split('(BLACK)').map((part: string, i: number, arr: string[]) => {
                              const answers = userAnswers[currentQuestionIndex] || [];
                              return (
                                <React.Fragment key={i}>
                                  <span>{part}</span>
                                  {i < arr.length - 1 && (
                                    <input
                                      disabled={hasVerified}
                                      value={answers[i] || ''}
                                      onChange={(e) => {
                                        const newAnswers = [...answers];
                                        newAnswers[i] = e.target.value;
                                        setUserAnswers({ ...userAnswers, [currentQuestionIndex]: newAnswers });
                                      }}
                                      placeholder="---"
                                      className={cn(
                                        "min-w-[120px] bg-transparent border-b-2 border-primary/20 focus:border-primary outline-none px-2 transition-all font-black uppercase italic text-center text-primary",
                                        hasVerified && (
                                          (answers[i] || '').trim().toLowerCase() === (currentQuestion.acceptableAnswers?.[i] || currentQuestion.correctAnswer || '').trim().toLowerCase() 
                                            ? "text-green-500 border-green-500" 
                                            : "text-destructive border-destructive"
                                        )
                                      )}
                                      style={{ width: `${Math.max(120, (answers[i]?.length || 0) * 12 + 30)}px` }}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {currentQuestion.type === 'short_answer' && (
                        <div className="space-y-6">
                          <Input 
                            disabled={hasVerified}
                            value={userAnswers[currentQuestionIndex] || ''}
                            onChange={(e) => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: e.target.value })}
                            placeholder="PROCESS INPUT..."
                            className="h-16 bg-white/[0.02] border-2 border-white/5 rounded-[1.2rem] px-6 text-xl font-black uppercase italic tracking-tighter focus:border-primary transition-all text-white shadow-inner"
                          />
                          {hasVerified && (
                            <div className={cn(
                              "p-6 rounded-[1.2rem] border-2 text-[9px] font-black uppercase tracking-widest italic animate-in slide-in-from-bottom-4",
                              isCorrect(currentQuestion, userAnswers[currentQuestionIndex]) ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-destructive/10 border-destructive/30 text-destructive"
                            )}>
                              <div className="flex items-center gap-2 mb-2 opacity-60"><Zap size={12} /> VALID:</div>
                              <div className="text-base">{currentQuestion.correctAnswer}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentQuestion.type === 'matching' && (
                        <div className="space-y-8 py-4">
                          <p className="text-center text-white/40 text-[10px] font-bold uppercase tracking-widest italic mb-2">Click an item on the left, then click its match on the right</p>
                          <div className="grid grid-cols-2 gap-6 relative items-start">
                            {/* Left Column (Static) */}
                            <div className="space-y-3">
                              {currentQuestion.matchingPairs?.map((pair: any, i: number) => {
                                const currentAnswers = userAnswers[currentQuestionIndex] || {};
                                const isMatched = currentAnswers[i] !== undefined;
                                const isSelected = selectedLeftId === i;
                                const matchValue = currentAnswers[i];
                                const matchIdxInShuffled = matchingShuffledRight.findIndex(p => p.match === matchValue);
                                
                                return (
                                  <button 
                                    key={`left-${i}`}
                                    disabled={hasVerified}
                                    onClick={() => {
                                      if (isSelected) setSelectedLeftId(null);
                                      else setSelectedLeftId(i);
                                      
                                      // If already matched, unmatch on click
                                      if (isMatched && !hasVerified) {
                                        const next = { ...currentAnswers };
                                        delete next[i];
                                        setUserAnswers({ ...userAnswers, [currentQuestionIndex]: next });
                                      }
                                    }}
                                    className={cn(
                                      "w-full text-left p-4 rounded-[1.2rem] border-2 transition-all flex items-center justify-between min-h-[60px]",
                                      isSelected ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)]" : 
                                      isMatched 
                                        ? (hasVerified 
                                            ? (currentAnswers[i] === pair.match ? "border-green-500 bg-green-500/10 text-green-500" : "border-destructive bg-destructive/10 text-destructive")
                                            : "border-primary/40 bg-primary/5")
                                        : "border-white/5 bg-white/[0.02] hover:border-white/10"
                                    )}
                                  >
                                    <div className="flex items-center gap-4">
                                      {isMatched && (
                                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] italic border bg-primary text-primary-foreground border-transparent")}>
                                          {i + 1}
                                        </div>
                                      )}
                                      <span className="font-black text-[11px] uppercase tracking-tight">{pair.prompt}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Right Column (Definitions - Shuffled once) */}
                            <div className="space-y-3">
                              {matchingShuffledRight.map((pair: any, idx: number) => {
                                const currentAnswers = userAnswers[currentQuestionIndex] || {};
                                // Find which left item matched this right item
                                const matchedLeftEntry = Object.entries(currentAnswers).find(([_, val]) => val === pair.match);
                                const matchedLeftIdx = matchedLeftEntry ? parseInt(matchedLeftEntry[0]) : null;
                                const isUsed = matchedLeftIdx !== null;
                                
                                return (
                                  <button 
                                    key={`right-${idx}`}
                                    disabled={hasVerified}
                                    onClick={() => {
                                      if (hasVerified) return;
                                      
                                      if (isUsed) {
                                        // Unmatch
                                        const next = { ...currentAnswers };
                                        delete next[matchedLeftIdx!];
                                        setUserAnswers({ ...userAnswers, [currentQuestionIndex]: next });
                                      } else if (selectedLeftId !== null) {
                                        // Match current selection
                                        const next = { ...currentAnswers, [selectedLeftId]: pair.match };
                                        setUserAnswers({ ...userAnswers, [currentQuestionIndex]: next });
                                        setSelectedLeftId(null);
                                      }
                                    }}
                                    className={cn(
                                      "w-full text-left p-4 rounded-[1.2rem] border-2 transition-all flex items-center justify-between min-h-[60px]",
                                      isUsed 
                                        ? (hasVerified 
                                            ? (currentQuestion.matchingPairs[matchedLeftIdx!].match === pair.match ? "border-green-500 bg-green-500/10 text-green-500" : "border-destructive bg-destructive/10 text-destructive")
                                            : "border-primary/40 bg-primary/5")
                                        : (selectedLeftId !== null ? "border-primary/20 bg-primary/[0.02] hover:border-primary/50" : "border-white/5 bg-white/[0.01]")
                                    )}
                                  >
                                    <div className="flex items-center gap-4">
                                      {isUsed && (
                                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] italic border bg-primary text-primary-foreground border-transparent")}>
                                          {matchedLeftIdx! + 1}
                                        </div>
                                      )}
                                      <span className="font-black text-[11px] uppercase tracking-tight">{pair.match}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex flex-col items-center pt-8">
                             {!hasVerified ? (
                               <Button 
                                 onClick={handleVerify}
                                 className="bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest px-12 rounded-xl h-12 shadow-2xl active:scale-95 transition-all"
                                 disabled={Object.keys(userAnswers[currentQuestionIndex] || {}).length < (currentQuestion.matchingPairs?.length || 0)}
                               >
                                 Check Answer
                               </Button>
                             ) : (
                               <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                 <div className="space-y-2">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Correct matches:</p>
                                   <div className="grid gap-2">
                                      {currentQuestion.matchingPairs?.map((pair: any, i: number) => (
                                        <div key={`sol-${i}`} className="flex items-center gap-2 text-xs font-bold text-white/60">
                                          <span>{pair.prompt}</span>
                                          <ArrowRight size={12} className="text-primary/40" />
                                          <span className="text-white">{pair.match}</span>
                                        </div>
                                      ))}
                                   </div>
                                 </div>
                                 <Button 
                                   onClick={handleNext}
                                   className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest px-12 rounded-xl h-12 shadow-2xl active:scale-95 transition-all"
                                 >
                                   Continue
                                 </Button>
                               </div>
                             )}
                          </div>
                        </div>
                      )}

                      {currentQuestion.type === 'ordering' && (
                        <div className="space-y-6 max-w-2xl mx-auto py-8">
                          <p className="text-center text-white/40 text-[10px] font-bold uppercase tracking-widest italic mb-2">Drag items to reorder</p>
                          <div className="space-y-3">
                            {(userAnswers[currentQuestionIndex] || []).map((step: string, i: number) => {
                              const isCorrectPos = hasVerified && step === currentQuestion.orderingSteps[i];
                              
                              return (
                                <div
                                  key={`order-${i}`}
                                  draggable={!hasVerified}
                                  onDragStart={(e) => {
                                    if (hasVerified) return;
                                    e.dataTransfer.setData('stepIndex', i.toString());
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    if (hasVerified) return;
                                    e.preventDefault();
                                    const sourceIdx = parseInt(e.dataTransfer.getData('stepIndex'));
                                    const next = [...(userAnswers[currentQuestionIndex] || [])];
                                    const temp = next[sourceIdx];
                                    next[sourceIdx] = next[i];
                                    next[i] = temp;
                                    setUserAnswers({ ...userAnswers, [currentQuestionIndex]: next });
                                  }}
                                  className={cn(
                                    "w-full p-4 rounded-[1.2rem] border-2 transition-all flex items-center gap-4 bg-white/[0.02] cursor-grab active:cursor-grabbing",
                                    hasVerified 
                                      ? (isCorrectPos ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10")
                                      : "border-white/5 hover:border-white/20"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <GripVertical size={14} className="text-white/20" />
                                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] italic border", hasVerified ? (isCorrectPos ? "bg-green-500 text-white border-transparent" : "bg-destructive text-white border-transparent") : "bg-white/5 text-white/30 border-white/5")}>
                                      {i + 1}
                                    </div>
                                  </div>
                                  <span className="font-black text-xs uppercase italic tracking-tight flex-1 text-left">{step}</span>
                                  {hasVerified && (
                                    <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">
                                      #{currentQuestion.orderingSteps.indexOf(step) + 1}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-col items-center pt-8">
                            {!hasVerified ? (
                              <Button 
                                onClick={handleVerify}
                                className="bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest px-12 rounded-xl h-12 shadow-2xl active:scale-95 transition-all"
                              >
                                Check Answer
                              </Button>
                            ) : (
                               <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                 <div className="space-y-3 bg-white/[0.02] border border-white/5 p-6 rounded-[1.5rem] text-left">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Correct order:</p>
                                   <div className="space-y-1">
                                      {currentQuestion.orderingSteps?.map((step: string, i: number) => (
                                        <div key={`sol-${i}`} className="flex items-center gap-2 text-xs font-bold text-white/60">
                                          <span className="text-primary/40 text-[9px] w-4">{i + 1}.</span>
                                          <span>{step}</span>
                                        </div>
                                      ))}
                                   </div>
                                 </div>
                                 <Button 
                                   onClick={handleNext}
                                   className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest px-12 rounded-xl h-12 shadow-2xl active:scale-95 transition-all"
                                 >
                                   Continue
                                 </Button>
                               </div>
                            )}
                          </div>
                        </div>
                      )}

                      {currentQuestion.type === 'blocking' && (
                        <div className="flex flex-col items-center space-y-12 py-10">
                          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white/30 tracking-[0.2em]">Deconstruct & Rebuild Sequence:</h2>
                          
                          <div className="flex flex-wrap justify-center gap-4 py-12 px-8 min-h-[180px] w-full bg-[#050505] rounded-[3rem] border-2 border-white/5 relative shadow-[inset_0_4px_40px_rgba(0,0,0,0.8)]">
                            {blockingChars.map((char, i) => (
                              <div
                                key={`block-${i}`}
                                draggable={!hasVerified && !blockingSuccess}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('sourceIndex', i.toString());
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));
                                  if (sourceIndex === i) return;

                                  const nextChars = [...blockingChars];
                                  const temp = nextChars[sourceIndex];
                                  nextChars[sourceIndex] = nextChars[i];
                                  nextChars[i] = temp;

                                  setBlockingChars(nextChars);
                                  setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: nextChars.join('') }));
                                  
                                  if (nextChars.join('').toLowerCase() === (currentQuestion.correctAnswer || '').toLowerCase()) {
                                    setBlockingSuccess(true);
                                    // playSFX('correct'); // Optional
                                    setTimeout(() => handleVerify(), 800);
                                  }
                                }}
                                className={cn(
                                  "w-14 h-20 md:w-18 md:h-24 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all duration-300 cursor-grab active:cursor-grabbing select-none",
                                  blockingSuccess || (hasVerified && blockingChars.join('').toLowerCase() === currentQuestion.correctAnswer?.toLowerCase())
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-in zoom-in-110"
                                    : "bg-[#111] border-white/5 text-white/80 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105"
                                )}
                              >
                                {char.toUpperCase()}
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col items-center gap-8">
                            {(blockingSuccess || hasVerified) && (
                              <div className="animate-in zoom-in-75 duration-700 flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                                  <Check size={32} className="text-emerald-500 stroke-[4]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 italic">NEURAL MATRIX SYNCED</span>
                              </div>
                            )}

                            <Button 
                              variant="outline" 
                              onClick={() => {
                                let word = currentQuestion.correctAnswer || '';
                                let shuffled = shuffleArray(word.split(''));
                                while (shuffled.join('') === word && word.length > 1) shuffled = shuffleArray(word.split(''));
                                setBlockingChars(shuffled);
                                setBlockingSuccess(false);
                                setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: shuffled.join('') }));
                              }}
                              disabled={hasVerified || blockingSuccess}
                              className="h-12 px-8 border-2 border-white/5 bg-white/5 text-white/20 hover:text-white hover:border-white/20 rounded-2xl gap-3 font-black text-[10px] uppercase tracking-[0.2em] italic group transition-all"
                            >
                              <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> RESET DISPLACEMENT
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* FEEDBACK & EXPLANATION BLOCK */}
                  {hasVerified && !['flashcard', 'reveal'].includes(currentQuestion.type) && (
                    <div className="mt-10 animate-in slide-in-from-bottom-6 fade-in duration-700">
                      <div className={cn(
                        "p-8 rounded-[1.5rem] border-2 relative overflow-hidden",
                        isCorrect(currentQuestion, userAnswers[currentQuestionIndex]) 
                          ? "bg-green-500/5 border-green-500/20 shadow-[0_20px_40px_-15px_rgba(34,197,94,0.1)]" 
                          : "bg-destructive/5 border-destructive/20 shadow-[0_20px_40px_-15px_rgba(239,68,68,0.1)]"
                      )}>
                        <div className="flex items-start gap-6 relative z-10">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2",
                            isCorrect(currentQuestion, userAnswers[currentQuestionIndex]) 
                              ? "bg-green-500/20 text-green-500 border-green-500/20" 
                              : "bg-destructive/20 text-destructive border-destructive/20"
                          )}>
                            {isCorrect(currentQuestion, userAnswers[currentQuestionIndex]) ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                          </div>
                          <div className="text-left space-y-2">
                            <h4 className={cn(
                              "text-xl font-black uppercase italic tracking-tighter",
                              isCorrect(currentQuestion, userAnswers[currentQuestionIndex]) ? "text-green-500" : "text-destructive"
                            )}>
                              {isCorrect(currentQuestion, userAnswers[currentQuestionIndex]) ? "CORRECT PROTOCOL!" : "LEARN: NEURAL RECALIBRATION"}
                            </h4>
                            {currentQuestion.explanation ? (
                              <p className="text-sm font-medium text-white/70 italic leading-relaxed max-w-2xl">{currentQuestion.explanation}</p>
                            ) : (
                              <p className="text-sm font-medium text-white/40 italic">No further data available for this session.</p>
                            )}
                          </div>
                        </div>

                        {/* Background decor */}
                        <div className={cn(
                          "absolute -right-4 -bottom-4 w-32 h-32 blur-3xl rounded-full opacity-10",
                          isCorrect(currentQuestion, userAnswers[currentQuestionIndex]) ? "bg-green-500" : "bg-destructive"
                        )} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-center pt-4 pb-12">
                {!hasVerified && !['flashcard', 'reveal'].includes(currentQuestion.type) ? (
                  <Button size="lg" disabled={!userAnswers[currentQuestionIndex]} onClick={handleVerify} className="h-14 px-16 bg-primary font-black rounded-[2rem] uppercase tracking-widest italic shadow-xl text-[11px]">CONFIRMAR RESPUESTA</Button>
                ) : (
                  <Button size="lg" onClick={handleNext} className="h-14 px-12 bg-white text-black hover:bg-white/90 font-black rounded-[1.5rem] uppercase tracking-tighter italic shadow-2xl text-[11px]">
                    {currentQuestionIndex === (sessionQuestions.length - 1) ? 'FINALIZE SESSION' : 'CONTINUE SEQUENCE'} <ChevronRight size={18} className="ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showResults) {
      const percentage = Math.round((correctStats / (correctStats + incorrectStats || 1)) * 100);
      const avgTime = Math.round(currentTime / (sessionQuestions.length || 1));
      
      const radius = 85;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      const getMotivationalMessage = (p: number) => {
        if (p >= 90) return "Â¡IncreÃ­ble dominio! Tu sincronizaciÃ³n cognitiva es perfecta.";
        if (p >= 70) return "Excelente desempeÃ±o. EstÃ¡s consolidando los conceptos clave.";
        if (p >= 50) return "Buen trabajo. Sigue practicando para alcanzar el 75% maÃ±ana.";
        return `Tu consistencia estÃ¡ mejorando. Sigue practicando para alcanzar el ${Math.min(50, p + 20)}% maÃ±ana.`;
      };

      return (
        <div className="flex items-center justify-center min-h-full p-6 bg-[#080a0c] font-sans selection:bg-blue-500/30 overflow-y-auto">
          <style jsx>{`
            .glass-card {
              background: rgba(22, 27, 34, 0.8);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 1.5rem;
              transition: all 0.3s ease;
            }
            .glass-card:hover {
              border-color: rgba(59, 130, 246, 0.3);
              background: rgba(22, 27, 34, 0.95);
            }
            .progress-ring {
              transition: stroke-dashoffset 0.35s;
              transform: rotate(-90deg);
              transform-origin: 50% 50%;
            }
            .accent-gradient {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-slide-up {
              animation: slideUp 0.6s ease-out forwards;
            }
          `}</style>

          <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up text-left my-auto">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-card p-8 flex flex-col items-center text-center">
                <div className="mb-2">
                  <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest">Resultado Final</h2>
                  <h1 className="text-3xl font-bold mt-1 text-white">Â¡Buen trabajo!</h1>
                </div>

                <div className="relative flex items-center justify-center my-8">
                  <svg width="200" height="200">
                    <circle className="text-gray-800" strokeWidth={12} stroke="currentColor" fill="transparent" r="85" cx="100" cy="100"/>
                    <circle 
                      className="text-blue-500 progress-ring" 
                      strokeWidth={12} 
                      strokeDasharray={circumference} 
                      strokeDashoffset={offset} 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="85" cx="100" cy="100"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white">{percentage}<span className="text-2xl text-blue-400">%</span></span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">PRECISIÃ“N</span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm max-w-xs italic">
                  {getMotivationalMessage(percentage)}
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
                      <Zap className="w-6 h-6" fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Tu Racha</p>
                      <p className="text-lg font-bold text-white">1 DÃ­a Activo</p>
                    </div>
                  </div>
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-tighter">NUEVA RACHA</span>
                </div>
                
                <div className="flex justify-between px-2">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => {
                    const isToday = i === (new Date().getDay() + 6) % 7;
                    return (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <span className={cn("text-[10px] font-bold", isToday ? "text-blue-400" : "text-gray-600")}>{day}</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full transition-all duration-500", 
                          isToday ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-125" : "bg-gray-800"
                        )} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 flex flex-col justify-center">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">DesempeÃ±o</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-medium">Correctas</span>
                      <span className="text-green-400 font-bold">{correctStats}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${(correctStats / (correctStats + incorrectStats || 1)) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-medium">Incorrectas</span>
                      <span className="text-red-400 font-bold">{incorrectStats}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${(incorrectStats / (correctStats + incorrectStats || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{formatDuration(currentTime)}</p>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-tight">Tiempo Total</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{avgTime}s</p>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-tight">Promedio/Preg</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-center p-12 text-center text-gray-500 italic text-sm">
                  Desliza hacia abajo para revisar tus fallos o comenzar una nueva lecciÃ³n.
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => { setIsQuizStarted(false); setShowResults(false); }}
                    className="flex-1 accent-gradient hover:opacity-90 py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1"
                  >
                    Siguiente LecciÃ³n
                  </button>
                  <button 
                    onClick={() => { setShowResults(false); setShowErrorReview(true); }}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 py-4 px-6 rounded-2xl font-bold text-white border border-gray-700 transition-all"
                  >
                    Revisar Errores
                  </button>
                </div>
                <button 
                  onClick={() => { 
                    if (onExit) onExit();
                    else { setIsQuizStarted(false); setShowResults(false); }
                  }}
                  className="w-full py-3 text-gray-500 hover:text-white font-medium text-sm transition-colors uppercase tracking-[0.2em]"
                >
                  Volver al Inicio
                </button>
              </div>

            </div>

          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
        <div className="flex items-end justify-between border-b border-white/5 pb-8">
          <div className="flex items-center gap-6 text-left">
            <button onClick={handleStartQuiz} className="w-14 h-14 bg-primary/10 rounded-[1.2rem] flex items-center justify-center text-primary border-4 border-primary/20 shadow-xl hover:bg-primary/20 transition-all">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </button>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
                Question Library
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white">
                      <MoreVertical size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-[#161616] border-white/10 shadow-2xl rounded-xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Organizar Biblioteca</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={() => handleSortLibrary('asc')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white cursor-pointer transition-all">
                      <SortAsc size={14} className="text-primary" /> Arriba hacia abajo (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortLibrary('desc')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white cursor-pointer transition-all">
                      <SortDesc size={14} className="text-accent" /> Abajo hacia arriba (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortLibrary('random')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-tight text-white/60 hover:bg-white/5 hover:text-white cursor-pointer transition-all">
                      <Shuffle size={14} className="text-orange-500" /> Aleatorio
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl cursor-help">
                    <Switch checked={compareMode} onCheckedChange={setCompareMode} />
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-tight text-white/80 italic leading-none">Modo Comparativo</span>
                      <span className="text-[8px] font-bold uppercase text-white/20 italic">Mostrar todas las variantes</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-[#161616] border-white/10 text-white font-bold text-[9px] uppercase italic tracking-widest max-w-[200px] text-center p-3 rounded-xl shadow-2xl">
                  Modo Comparativo Global: Anula las reglas individuales y muestra todas las variantes de todo el notebook.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowErrorReview(true)} className="h-10 px-6 rounded-xl border-white/5 bg-white/5 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest italic">
                <AlertCircle size={16} className="mr-2 text-destructive" /> REVISAR FALLOS ({dayErrors.length})
              </Button>
              <Button size="sm" onClick={() => openEditModal(null)} className="bg-white text-black hover:bg-white/90 font-black h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest">
                <Plus size={16} className="mr-2" /> CONSTRUCT ITEM
              </Button>
            </div>
          </div>
        </div>

        {/* Dynamic Presets Bar */}
        <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">Question Presets</span>
              <div className="h-px w-8 bg-white/5" />
            </div>
            {selectedIndices.size > 0 && (
              <Button 
                onClick={() => setIsSavePresetDialogOpen(true)}
                className="h-7 px-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest italic animate-in fade-in"
              >
                <PlusCircle size={12} className="mr-1.5" /> Guardar SelecciÃ³n ({selectedIndices.size})
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {questionPresets
              .filter(p => !p.isPrivate || p.noteId === currentNoteId)
              .length === 0 ? (
              <p className="text-[9px] text-white/10 font-bold uppercase italic p-2 border border-dashed border-white/5 rounded-xl w-full text-center">No hay selecciones guardadas.</p>
            ) : (
              questionPresets.map((preset, pIdx) => (
                <div key={pIdx} className="group relative">
                  <button 
                    onClick={() => applyPreset(preset.indices)}
                    className={cn(
                      "h-9 px-4 rounded-xl border flex items-center gap-2 transition-all hover:scale-105 active:scale-95",
                      preset.indices.every(idx => selectedIndices.has(idx)) && preset.indices.length > 0
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                        : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/10"
                    )}
                  >
                    <Layers size={14} className="opacity-40" />
                    <span className="text-[10px] font-black uppercase tracking-wider italic">{preset.name}</span>
                    <Badge className="bg-white/10 text-[9px] h-4 px-1.5 border-0 rounded-md italic">{preset.indices.length}</Badge>
                  </button>
                  <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingPresetIndex(pIdx);
                        setNewPresetName(preset.name);
                        setIsPresetPrivate(!!preset.isPrivate);
                        setIsSavePresetDialogOpen(true);
                      }}
                      className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center hover:scale-110"
                    >
                      <Pencil size={8} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePreset(pIdx); }}
                      className="w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center hover:scale-110"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Dialog open={isSavePresetDialogOpen} onOpenChange={setIsSavePresetDialogOpen}>
          <DialogContent className="bg-[#0f0f11] border-white/10 rounded-[2rem] max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-black italic uppercase italic tracking-tighter text-white">Nombre de la SelecciÃ³n</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-white/30 italic px-1">PRESET IDENTIFIER</Label>
                <Input 
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="NOMBRE DEL PRESET (EJ: FINAL EXAM)"
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-white font-black uppercase italic text-xs px-4 focus:border-primary/50"
                  onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Lock size={14} className="text-primary/60" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-tight text-white/80 italic">Individual Mode</span>
                    <span className="text-[8px] font-bold uppercase text-white/20 italic">Encadenar solo a esta nota</span>
                  </div>
                </div>
                <Switch checked={isPresetPrivate} onCheckedChange={setIsPresetPrivate} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsSavePresetDialogOpen(false)} variant="ghost" className="text-white/40 uppercase font-black text-[10px] tracking-widest">Cancelar</Button>
              <Button onClick={savePreset} disabled={!newPresetName.trim()} className="bg-primary text-white rounded-xl font-black italic uppercase text-xs h-11 px-6 shadow-[0_10px_20px_-10px_rgba(var(--primary),0.5)]">Guardar Preset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 gap-3">
          {(quiz?.quiz || []).map((q, idx) => (
            <Card 
              key={idx} 
              className={cn(
                "bg-[#111]/40 border-white/5 hover:border-primary/50 transition-all group rounded-[1.2rem] border-2 cursor-pointer shadow-lg", 
                selectedIndices.has(idx) && "border-primary/40",
                q.variants && q.variants.length > 0 && "shadow-[0_0_25px_rgba(168,85,247,0.3)] border-purple-500/20"
              )} 
              onClick={() => openEditModal(idx)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0 text-left">
                  <Checkbox checked={selectedIndices.has(idx)} onCheckedChange={() => toggleQuestionSelection(idx)} onClick={(e) => e.stopPropagation()} />
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary border border-white/5">{getIconForType(q.type)}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black truncate text-sm uppercase italic text-white/90">{q.type === 'flashcard' ? q.front : (q.question || "UNTITLED VECT")}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Badge className="text-[8px] font-black uppercase h-4 px-2 bg-primary/10 text-primary border-0 rounded-md italic">{q.difficulty}</Badge>
                      <span className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] italic">{q.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-primary" onClick={(e) => { e.stopPropagation(); openEditModal(idx); }}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-destructive" onClick={(e) => {
                    e.stopPropagation();
                    const next = quiz!.quiz.filter((_, i) => i !== idx);
                    setQuiz({ ...quiz!, quiz: next });
                  }}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {quiz?.quiz && quiz.quiz.length > 0 ? (
            <Button size="lg" className="w-full mt-6 bg-primary font-black rounded-[1.5rem] h-14 uppercase tracking-tighter italic text-[13px]" onClick={handleStartQuiz}>INITIATE COGNITIVE SESSION</Button>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
              <p className="text-sm font-black uppercase italic tracking-tighter text-white/20">Synaptic cache is empty.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full relative overflow-y-auto custom-scrollbar">
      {renderQuizContent()}
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[650px] p-0 bg-background/95 backdrop-blur-3xl border-white/5 flex flex-col max-h-[85vh] rounded-[2.2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-2">
          <DialogHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0 text-left">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20"><Layers size={20} /></div>
              <div><DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-white">QUESTION DESK</DialogTitle></div>
            </div>
            <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-white/40 hover:text-white"><X size={20} /></button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 text-left custom-scrollbar relative">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">QUESTION TYPE</Label>
                <Select value={editForm.type} onValueChange={(val) => setEditForm({...editForm, type: val})}>
                  <SelectTrigger className="h-11 bg-white/[0.03] border-2 border-white/5 rounded-xl font-black text-[10px] uppercase italic tracking-tighter text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-2 border-white/10 rounded-xl">
                    {['multiple_choice', 'true_false', 'short_answer', 'fill_in_blank', 'matching', 'ordering', 'flashcard', 'reveal', 'blocking'].map(type => (
                      <SelectItem key={type} value={type} className="font-black text-[9px] uppercase italic text-white/60 p-2.5">
                        <div className="flex items-center gap-2">{getIconForType(type)}<span>{type.replace(/_/g, ' ')}</span></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">DEPTH</Label>
                <Select value={editForm.difficulty} onValueChange={(val) => setEditForm({...editForm, difficulty: val})}>
                  <SelectTrigger className="h-11 bg-white/[0.03] border-2 border-white/5 rounded-xl font-black text-[10px] uppercase italic tracking-tighter text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-2 border-white/10 rounded-xl">
                    <SelectItem value="easy" className="text-green-500 font-black text-[9px] uppercase italic p-2.5">EASY // RECALL</SelectItem>
                    <SelectItem value="medium" className="text-orange-500 font-black text-[9px] uppercase italic p-2.5">MEDIUM // ANALYZE</SelectItem>
                    <SelectItem value="hard" className="text-destructive font-black text-[9px] uppercase italic p-2.5">HARD // EVALUATE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editForm.type === 'multiple_choice' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Question</Label>
                  <Textarea 
                    value={editForm.question} 
                    onChange={(e) => handleQuestionChange(e.target.value)} 
                    placeholder="What do you want to ask?"
                    className={cn(
                      "min-h-[100px] bg-white/[0.03] border-2 rounded-xl p-4 text-sm font-medium text-white",
                      !editForm.question.trim() ? "border-destructive/50" : "border-white/5"
                    )} 
                  />
                  {!editForm.question.trim() && (
                    <p className="text-[10px] text-destructive font-bold uppercase italic tracking-widest">Question is required</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Answer Options</Label>
                      <p className="text-[11px] text-white/40 font-medium italic">Select the correct answer</p>
                    </div>
                    
                    <div className="relative">
                      <Button 
                        onClick={() => setShowBlacklistPanel(!showBlacklistPanel)}
                        variant="outline" 
                        size="sm" 
                        className={cn(
                          "h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border-primary/20 gap-1.5 italic transition-all",
                          showBlacklistPanel ? "bg-primary text-primary-foreground" : "bg-primary/5 text-primary hover:bg-primary/10"
                        )}
                      >
                        <ShieldCheck size={12} /> BLACKLIST
                      </Button>

                      {showBlacklistPanel && (
                        <div 
                          className="absolute bottom-full right-0 mb-3 w-80 bg-[#0d0d0f] border-2 border-white/10 p-6 rounded-[1.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] z-[100] animate-in fade-in slide-in-from-bottom-2 pointer-events-auto"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-5">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase italic tracking-tighter text-white">Neural Blacklist</h4>
                                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest italic">Words to auto-filter</p>
                              </div>
                              <button onClick={() => setShowBlacklistPanel(false)} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
                            </div>
                            
                            <div className="flex gap-2">
                              <Input 
                                value={newBlacklistWord}
                                onChange={(e) => setNewBlacklistWord(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newBlacklistWord.trim()) {
                                    e.preventDefault();
                                    const word = newBlacklistWord.trim();
                                    if (!dynamicBlacklist.includes(word)) {
                                      setDynamicBlacklist([...dynamicBlacklist, word]);
                                    }
                                    setNewBlacklistWord('');
                                  }
                                }}
                                placeholder="Add word..." 
                                className="h-10 bg-white/[0.03] border-2 border-white/5 rounded-xl px-4 text-[10px] font-black uppercase italic text-white"
                              />
                              <Button 
                                size="icon" 
                                onClick={() => {
                                  if (newBlacklistWord.trim()) {
                                    const word = newBlacklistWord.trim();
                                    if (!dynamicBlacklist.includes(word)) {
                                      setDynamicBlacklist([...dynamicBlacklist, word]);
                                    }
                                    setNewBlacklistWord('');
                                  }
                                }}
                                className="bg-primary rounded-xl h-10 w-10 shrink-0"
                              >
                                <Plus size={16} />
                              </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 custom-scrollbar">
                              {dynamicBlacklist.map(word => (
                                <Badge key={word} className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg flex items-center gap-2 group transition-all">
                                  <span className="text-[9px] font-black uppercase italic tracking-tighter">{word}</span>
                                  <button onClick={() => setDynamicBlacklist(dynamicBlacklist.filter(w => w !== word))} className="text-primary/40 hover:text-primary"><X size={10} /></button>
                                </Badge>
                              ))}
                              {dynamicBlacklist.length === 0 && (
                                <p className="text-[9px] font-black text-white/10 uppercase italic w-full text-center py-4">Cache is clean</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {editForm.options.map((opt: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 group">
                        <button 
                          onClick={() => setEditForm({...editForm, correctAnswer: opt})}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0", 
                            editForm.correctAnswer === opt 
                              ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                              : "border-white/10 hover:border-white/20"
                          )}
                        >
                          {editForm.correctAnswer === opt && <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />}
                        </button>
                        <div className="flex-1 relative">
                          <Input 
                            value={opt} 
                            onChange={(e) => { 
                              const next = [...editForm.options]; 
                              const oldVal = next[i];
                              const cleaned = e.target.value;
                              next[i] = cleaned; 
                              const updates: any = { options: next };
                              if (editForm.correctAnswer === oldVal) {
                                updates.correctAnswer = cleaned;
                              }
                              setEditForm({...editForm, ...updates});
                            }} 
                            placeholder={`Option ${i + 1}`}
                            className="h-12 bg-white/[0.03] border-2 border-white/5 focus:border-primary/50 rounded-xl px-4 text-sm font-medium text-white"
                          />
                          {editForm.options.length > 2 && (
                            <button 
                              onClick={() => {
                                const next = editForm.options.filter((_:any, idx:number) => idx !== i);
                                setEditForm({...editForm, options: next});
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setEditForm({...editForm, options: [...editForm.options, '']})}
                    className="w-full h-12 border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-xl flex items-center justify-center gap-2 text-primary text-xs font-black uppercase italic tracking-widest transition-all hover:bg-primary/5"
                  >
                    <Plus size={16} /> Add option
                  </button>
                </div>
              </div>
            )}

            {editForm.type === 'true_false' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Statement</Label>
                  <Textarea value={editForm.question} onChange={(e) => setEditForm({...editForm, question: e.target.value})} className="min-h-[100px] bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl p-4 text-sm font-medium" />
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Correct Answer</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {['True', 'False'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setEditForm({ ...editForm, correctAnswer: opt })}
                        className={cn(
                          "flex flex-col items-center justify-center h-28 rounded-[1.5rem] border-2 transition-all gap-2",
                          editForm.correctAnswer === opt ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-[#111] text-white/20"
                        )}
                      >
                        {opt === 'True' ? <CheckCircle size={24} /> : <X size={24} />}
                        <span className="font-black text-xs uppercase italic tracking-widest">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {editForm.type === 'short_answer' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Question</Label>
                  <Textarea value={editForm.question} onChange={(e) => setEditForm({...editForm, question: e.target.value})} className="min-h-[100px] bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl p-4 text-sm font-medium" />
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Correct Answer & Variations</Label>
                  <div className="space-y-3">
                    <Input value={editForm.correctAnswer} onChange={(e) => setEditForm({...editForm, correctAnswer: e.target.value})} placeholder="PRIMARY ANSWER..." className="h-11 bg-[#111] border-2 border-white/5 rounded-xl px-4 font-black text-[10px] uppercase italic" />
                    {(editForm.acceptableAnswers || []).map((alt: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <Input value={alt} onChange={(e) => { const next = [...editForm.acceptableAnswers]; next[i] = e.target.value; setEditForm({...editForm, acceptableAnswers: next}); }} className="h-11 bg-[#111] border-2 border-white/5 rounded-xl px-4 font-black text-[10px] uppercase italic flex-1" />
                        <button onClick={() => setEditForm({...editForm, acceptableAnswers: editForm.acceptableAnswers.filter((_:any,idx:number)=>idx!==i)})} className="p-2 text-white/10 hover:text-destructive"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <button onClick={() => setEditForm({...editForm, acceptableAnswers: [...(editForm.acceptableAnswers || []), '']})} className="w-full h-11 border-2 border-dashed border-white/5 hover:border-primary/50 rounded-xl text-white/20 font-black uppercase text-[8px] italic tracking-widest">+ ADD VARIATION</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase italic text-white">Require exact capitalization</Label>
                  <Switch checked={editForm.caseSensitive} onCheckedChange={(val) => setEditForm({...editForm, caseSensitive: val})} />
                </div>
              </div>
            )}

            {editForm.type === 'fill_in_blank' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Text with Blanks</Label>
                    <div className="flex items-center gap-2 text-[9px] text-white/40 font-bold uppercase tracking-tight italic">
                      Use <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-all text-[8px] font-black py-0.5 px-2 bg-white/5 text-white/60 border-white/10" onClick={() => { navigator.clipboard.writeText('(BLACK)'); toast({ title: "COPIED" }); }}>(BLACK)</Badge> for blanks
                    </div>
                  </div>
                  <Textarea value={editForm.question} onChange={(e) => handleQuestionChange(e.target.value)} placeholder="The capital of France is (BLACK)." className="min-h-[120px] bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl p-4 text-sm font-medium" />
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Blank Answers</Label>
                  <div className="space-y-3">
                    {detectedBlanksCount > 0 ? (
                      Array.from({ length: detectedBlanksCount }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center font-black text-[10px] text-white/20 italic">{i + 1}</div>
                          <Input value={editForm.acceptableAnswers?.[i] || ''} onChange={(e) => { const next = [...(editForm.acceptableAnswers || [])]; next[i] = e.target.value; setEditForm({...editForm, acceptableAnswers: next}); }} placeholder={`ANSWER FOR BLANK ${i + 1}...`} className="h-11 bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl px-4 font-black text-[10px] uppercase italic" />
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]"><p className="text-[8px] font-black uppercase tracking-widest text-white/10 italic">No markers detected yet.</p></div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {editForm.type === 'flashcard' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Front (Concept)</Label>
                  <Textarea value={editForm.front} onChange={(e) => setEditForm({...editForm, front: e.target.value})} className="min-h-[100px] bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl p-4 text-sm font-medium" />
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Back (Definition)</Label>
                  <Textarea value={editForm.back} onChange={(e) => setEditForm({...editForm, back: e.target.value})} className="min-h-[100px] bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl p-4 text-sm font-medium" />
                </div>
              </div>
            )}

            {editForm.type === 'reveal' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Clue / Term</Label>
                    <Input value={editForm.question} onChange={(e) => setEditForm({...editForm, question: e.target.value})} className="h-11 bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl px-4 font-medium" />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Preview Seconds</Label>
                    <Input type="number" value={editForm.independentPreviewSeconds} onChange={(e) => setEditForm({...editForm, independentPreviewSeconds: parseInt(e.target.value, 10)})} className="h-11 bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl px-4 font-medium" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Hidden Content</Label>
                  <Textarea value={editForm.correctAnswer} onChange={(e) => setEditForm({...editForm, correctAnswer: e.target.value})} className="min-h-[100px] bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl p-4 text-sm font-medium" />
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Audio Clue (Import from files)</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Headphones size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                      <Input 
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (previewAudioRef.current) {
                              previewAudioRef.current.pause();
                              setIsPreviewPlaying(false);
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setEditForm({ ...editForm, audioUrl: event.target?.result as string });
                              toast({ title: "Audio importado", description: file.name });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="h-12 bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl pl-12 pr-4 text-xs pt-3 cursor-pointer" 
                      />
                    </div>
                    {editForm.audioUrl && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive border-2 border-destructive/20 hover:bg-destructive/20"
                        onClick={() => {
                          setEditForm({ ...editForm, audioUrl: '' });
                          if (previewAudioRef.current) {
                            previewAudioRef.current.pause();
                            setIsPreviewPlaying(false);
                          }
                        }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                  {editForm.audioUrl && (
                    <button 
                      onClick={() => {
                        if (previewAudioRef.current && !previewAudioRef.current.paused) {
                          previewAudioRef.current.pause();
                          setIsPreviewPlaying(false);
                        } else {
                          const audio = new Audio(editForm.audioUrl);
                          previewAudioRef.current = audio;
                          setIsPreviewPlaying(true);
                          audio.play().catch(e => {
                            toast({ variant: "destructive", title: "Error de reproducciÃ³n", description: "No se pudo reproducir el audio." });
                            setIsPreviewPlaying(false);
                          });
                          audio.onended = () => setIsPreviewPlaying(false);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2 hover:bg-primary/10 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        {isPreviewPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                          {isPreviewPlaying ? "Reproduciendo vista previa" : "Audio cargado correctamente"}
                        </span>
                        <span className="text-[8px] font-bold uppercase text-white/30 tracking-tight">
                          {isPreviewPlaying ? "Haz clic para pausar" : "Haz clic para escuchar vista previa"}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {editForm.type === 'matching' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">Matching Pairs</h4>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest italic">Connect terms on the left with their matches on the right</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_40px_1fr_40px] gap-4 px-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Term (Left Column)</span>
                    <div />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Match (Right Column)</span>
                    <div />
                  </div>

                  <div className="space-y-3">
                    {editForm.matchingPairs.map((p: any, i: number) => (
                      <div key={i} className="grid grid-cols-[1fr_40px_1fr_40px] gap-4 items-center group relative animate-in slide-in-from-left-2 duration-300">
                        <div className="relative">
                           <Input 
                            value={p.prompt} 
                            onChange={(e) => { 
                              const next = [...editForm.matchingPairs]; 
                              next[i].prompt = e.target.value; 
                              setEditForm({...editForm, matchingPairs: next}); 
                            }} 
                            placeholder={`Concept ${i+1}`} 
                            className="h-14 bg-white/[0.03] border-2 border-white/5 focus:border-primary/50 rounded-[1.2rem] px-5 text-sm font-black text-white italic tracking-tight" 
                          />
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => {
                              const next = [...editForm.matchingPairs];
                              const temp = next[i].prompt;
                              next[i].prompt = next[i].match;
                              next[i].match = temp;
                              setEditForm({...editForm, matchingPairs: next});
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-primary hover:border-primary/50 transition-all group/swap"
                            title="Swap Sides"
                          >
                            <ArrowRightLeft size={12} className="group-hover/swap:rotate-180 transition-transform duration-500" />
                          </button>
                        </div>

                        <div className="relative">
                          <Input 
                            value={p.match} 
                            onChange={(e) => { 
                              const next = [...editForm.matchingPairs]; 
                              next[i].match = e.target.value; 
                              setEditForm({...editForm, matchingPairs: next}); 
                            }} 
                            placeholder={`Definition ${i+1}`} 
                            className="h-14 bg-white/[0.03] border-2 border-white/5 focus:border-primary/50 rounded-[1.2rem] px-5 text-sm font-black text-white italic tracking-tight" 
                          />
                        </div>

                        <button 
                          onClick={() => setEditForm({...editForm, matchingPairs: editForm.matchingPairs.filter((_:any,idx:number)=>idx!==i)})}
                          className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive shadow-lg"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setEditForm({...editForm, matchingPairs: [...editForm.matchingPairs, {prompt:'', match:''}]})}
                    className="w-full h-14 border-2 border-dashed border-primary/20 hover:border-primary rounded-[1.2rem] bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus size={20} className="text-primary group-hover:scale-125 transition-transform" />
                    <span className="font-black text-[11px] uppercase italic tracking-widest text-primary">Add New Correlation Pair</span>
                  </button>
                </div>
              </div>
            )}

            {editForm.type === 'blocking' && (
              <div className="space-y-6">
                <div className="space-y-4 text-left">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Clue / Theme</Label>
                  <Textarea value={editForm.question} onChange={(e) => setEditForm({...editForm, question: e.target.value})} placeholder="What the user needs to reconstruct (e.g. 'Photosynthesis')" className="min-h-[100px] bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl p-4 text-sm font-medium" />
                </div>
                <div className="space-y-4 text-left">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Correct Sequence (The Word)</Label>
                  <Input value={editForm.correctAnswer} onChange={(e) => setEditForm({...editForm, correctAnswer: e.target.value})} placeholder="THE WORD..." className="h-11 bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl px-4 font-black text-[10px] uppercase italic" />
                </div>
              </div>
            )}



            {editForm.type === 'ordering' && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Question</Label>
                  <Textarea 
                    value={editForm.question} 
                    onChange={(e) => setEditForm({...editForm, question: e.target.value})} 
                    placeholder="What do you want to ask?"
                    className="min-h-[100px] bg-[#111] border-2 border-white/5 rounded-xl p-4 text-sm font-medium focus:border-primary/50" 
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-white uppercase italic tracking-tight">Correct Order</Label>
                    <p className="text-[11px] text-white/40 font-medium italic">Use arrows to reorder. Items will be shuffled during quiz.</p>
                  </div>

                  <div className="space-y-3">
                    {editForm.orderingSteps.map((step: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 group">
                        <div className="flex flex-col gap-1 text-white/20">
                          <button 
                            disabled={i === 0}
                            onClick={() => {
                              const next = [...editForm.orderingSteps];
                              [next[i], next[i-1]] = [next[i-1], next[i]];
                              setEditForm({...editForm, orderingSteps: next});
                            }}
                            className="hover:text-primary disabled:opacity-0 transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button 
                            disabled={i === editForm.orderingSteps.length - 1}
                            onClick={() => {
                              const next = [...editForm.orderingSteps];
                              [next[i], next[i+1]] = [next[i+1], next[i]];
                              setEditForm({...editForm, orderingSteps: next});
                            }}
                            className="hover:text-primary disabled:opacity-0 transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <div className="flex-1 relative">
                          <Input 
                            value={step} 
                            onChange={(e) => { 
                              const next = [...editForm.orderingSteps]; 
                              next[i] = e.target.value; 
                              setEditForm({...editForm, orderingSteps: next}); 
                            }} 
                            placeholder={`Item ${i + 1}`}
                            className="h-12 bg-[#111] border-2 border-white/5 focus:border-primary/50 rounded-xl px-4 text-sm font-medium"
                          />
                          {editForm.orderingSteps.length > 2 && (
                            <button 
                              onClick={() => {
                                const next = editForm.orderingSteps.filter((_:any, idx:number) => idx !== i);
                                setEditForm({...editForm, orderingSteps: next});
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setEditForm({...editForm, orderingSteps: [...editForm.orderingSteps, '']})}
                    className="w-full h-12 border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-xl flex items-center justify-center gap-2 text-primary text-xs font-black uppercase italic tracking-widest transition-all hover:bg-primary/5"
                  >
                    <Plus size={16} /> Add item
                  </button>
                </div>
              </div>
            )}
            {/* HINT & EXPLANATION SECTION - INLINE ACCORDION */}
            <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
              <Button 
                variant="outline" 
                onClick={() => setIsHintExpanded(!isHintExpanded)}
                className={cn(
                  "w-full h-11 bg-white/[0.02] border-2 rounded-xl flex items-center justify-between px-4 transition-all group",
                  isHintExpanded ? "border-primary/40 bg-primary/5" : "border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-white/80">Hint & Explanation</span>
                </div>
                <ChevronDown size={14} className={cn("text-white/20 transition-transform", isHintExpanded && "rotate-180")} />
              </Button>
              
              {isHintExpanded && (
                <div className="space-y-6 p-6 bg-[#0d0d0f]/50 rounded-[1.5rem] border border-white/5 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2 text-left">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">Hint (Shown before answering)</Label>
                    <Textarea 
                      value={editForm.hint || ''} 
                      onChange={(e) => setEditForm({...editForm, hint: e.target.value})}
                      placeholder="A subtle clue to help remember..."
                      className="bg-white/[0.03] border-2 border-white/5 rounded-xl min-h-[80px] text-sm text-white focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">Explanation (Shown after answering)</Label>
                    <Textarea 
                      value={editForm.explanation || ''} 
                      onChange={(e) => setEditForm({...editForm, explanation: e.target.value})}
                      placeholder="Why this answer is correct..."
                      className="bg-white/[0.03] border-2 border-white/5 rounded-xl min-h-[80px] text-sm text-white focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* VARIANTS SECTION */}
            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase italic tracking-tighter text-white/80">Question Variants</h4>
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">Alternative versions for randomized rotation</p>
                </div>
                <Button 
                  onClick={() => {
                    const newVariant = { 
                      ...editForm, 
                      question: '', 
                      correctAnswer: '', 
                      options: editForm.type === 'multiple_choice' ? ['', '', '', ''] : [],
                      front: '',
                      back: '',
                      acceptableAnswers: [],
                      variants: [] 
                    };
                    delete (newVariant as any).variants;
                    setEditForm({ ...editForm, variants: [...(editForm.variants || []), newVariant] });
                  }}
                  variant="outline" 
                  size="sm" 
                  className="h-8 rounded-xl bg-primary/5 border-primary/20 text-primary hover:bg-primary/20 font-black text-[9px] uppercase italic tracking-widest gap-2"
                >
                  <PlusCircle size={14} /> AÃ±adir Variante de Pregunta
                </Button>
              </div>

              {/* ROTATION RULES FOR THIS DESK */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-1 duration-300">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase italic tracking-tighter text-white/50">ROTATION RULE FOR THIS DESK</span>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[8px] font-bold uppercase text-primary italic">Total Versions: {1 + (editForm.variants?.length || 0)}</span>
                  </div>
                </div>

                <div className="flex bg-black/40 p-1 rounded-xl gap-1 border border-white/5">
                  <TooltipProvider>
                    {[
                      { 
                        id: 'all', 
                        label: 'ALL', 
                        sub: 'DESK', 
                        tip: "Muestra todas las variantes de esta pregunta en la misma sesiÃ³n." 
                      },
                      { 
                        id: 'random_1', 
                        label: 'R1', 
                        sub: 'RANDOM', 
                        tip: "Selecciona una Ãºnica variante al azar (original o extra) para el quiz." 
                      },
                      { 
                        id: 'random_2', 
                        label: 'R2', 
                        sub: 'PICK 2', 
                        tip: "Selecciona dos versiones al azar (requiere al menos 3 versiones en total)." 
                      }
                    ].map((mode) => (
                      <Tooltip key={mode.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setEditForm({ ...editForm, variantSelectionMode: mode.id })}
                            disabled={mode.id === 'random_2' && (1 + (editForm.variants?.length || 0)) < 3}
                            className={cn(
                              "flex flex-col items-center justify-center h-11 w-16 rounded-lg transition-all border border-transparent",
                              editForm.variantSelectionMode === mode.id 
                                ? "bg-primary text-white shadow-lg shadow-primary/20 border-primary/20" 
                                : "text-white/20 hover:text-white/60 hover:bg-white/5",
                              mode.id === 'random_2' && (1 + (editForm.variants?.length || 0)) < 3 ? "opacity-30 cursor-not-allowed hidden" : ""
                            )}
                          >
                            <span className="text-[11px] font-black italic tracking-tighter leading-none">{mode.label}</span>
                            <span className="text-[7px] font-black uppercase italic opacity-40">{mode.sub}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-[#161616] border-white/10 text-white font-bold text-[9px] uppercase italic tracking-widest max-w-[200px] text-center p-3 rounded-xl shadow-2xl">
                          {mode.tip}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>

              <div className="space-y-4 pb-4">
                {(editForm.variants || []).map((variant: any, vIdx: number) => (
                  <div key={vIdx} className="p-5 bg-white/[0.02] border-2 border-white/5 rounded-[1.5rem] space-y-5 animate-in slide-in-from-top-2 duration-300 relative group/variant">
                    <button 
                      onClick={() => setEditForm({ ...editForm, variants: editForm.variants.filter((_:any, i:number) => i !== vIdx) })}
                      className="absolute top-4 right-4 p-2 text-white/10 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                       <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase italic px-2">VARIANTE {vIdx + 1}</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">TÃ­tulo / Enunciado</Label>
                      <Textarea 
                        value={variant.question || variant.front || ''} 
                        onChange={(e) => {
                          const next = [...editForm.variants];
                          const val = e.target.value;
                          
                          // Smart Import for variants
                          if (editForm.type === 'multiple_choice') {
                            const mcPattern = /([^]*?)\n\s*[Aa][\.\)]\s*([^]*?)\n\s*[Bb][\.\)]\s*([^]*?)\n\s*[Cc][\.\)]\s*([^]*?)\n\s*[Dd][\.\)]\s*([^]*?)$/;
                            const match = val.match(mcPattern);
                            if (match) {
                              next[vIdx].question = match[1].trim();
                              next[vIdx].options = [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()];
                              next[vIdx].correctAnswer = next[vIdx].options[0]; // Default
                              setEditForm({ ...editForm, variants: next });
                              return;
                            }
                          }
                          
                          if (editForm.type === 'flashcard') next[vIdx].front = val;
                          else next[vIdx].question = val;
                          setEditForm({ ...editForm, variants: next });
                        }}
                        className="min-h-[80px] bg-black/20 border-white/5 rounded-xl text-sm font-medium text-white/80"
                      />
                    </div>

                    {editForm.type === 'multiple_choice' && (
                      <div className="grid grid-cols-2 gap-3">
                        {(variant.options || []).map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="relative">
                            <Input 
                              value={opt}
                              onChange={(e) => {
                                const nextItems = [...editForm.variants];
                                const nextOpts = [...nextItems[vIdx].options];
                                nextOpts[oIdx] = e.target.value;
                                nextItems[vIdx].options = nextOpts;
                                setEditForm({ ...editForm, variants: nextItems });
                              }}
                              className={cn(
                                "h-10 bg-black/20 border-white/5 rounded-xl text-[10px] font-bold pr-8",
                                variant.correctAnswer === opt ? "border-primary/50 text-primary" : "text-white/40"
                              )}
                            />
                            <button 
                              onClick={() => {
                                const next = [...editForm.variants];
                                next[vIdx].correctAnswer = opt;
                                setEditForm({ ...editForm, variants: next });
                              }}
                              className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                                variant.correctAnswer === opt ? "bg-primary border-primary" : "border-white/10 hover:border-white/20"
                              )}
                            >
                              {variant.correctAnswer === opt && <Check size={8} className="text-white" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(editForm.type === 'short_answer' || editForm.type === 'true_false' || editForm.type === 'fill_in_blank') && (
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Respuesta Correcta</Label>
                        <Input 
                          value={variant.correctAnswer || ''}
                          onChange={(e) => {
                            const next = [...editForm.variants];
                            next[vIdx].correctAnswer = e.target.value;
                            setEditForm({ ...editForm, variants: next });
                          }}
                          className="h-10 bg-black/20 border-white/5 rounded-xl text-[10px] font-bold text-primary"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-white/5 flex flex-row items-center justify-end gap-6 bg-black/40">
            <button onClick={() => setIsEditModalOpen(false)} className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors italic">DISCARD</button>
            <Button onClick={handleSaveQuestion} className="h-12 px-8 bg-primary hover:bg-primary/90 rounded-xl font-black text-[10px] uppercase italic tracking-tighter shadow-2xl">COMMIT VECT</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizView;
