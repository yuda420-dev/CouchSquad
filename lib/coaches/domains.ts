import {
  Dumbbell,
  Apple,
  Briefcase,
  Heart,
  Brain,
  DollarSign,
  Baby,
  Flower2,
  Crown,
  Palette,
  BookOpen,
  Moon,
  Timer,
  Mic,
  Sparkles,
  GraduationCap,
  Shirt,
  Plane,
  Music,
  Shield,
  HeartPulse,
  PawPrint,
  type LucideIcon,
} from "lucide-react";

export interface Domain {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;        // tailwind bg class
  description: string;
}

export const DOMAINS: Domain[] = [
  { id: "fitness", label: "Fitness", icon: Dumbbell, color: "bg-red-500", description: "Strength, movement, and physical performance" },
  { id: "nutrition", label: "Nutrition", icon: Apple, color: "bg-green-500", description: "Food, diet, and fueling your body" },
  { id: "career", label: "Career", icon: Briefcase, color: "bg-blue-500", description: "Professional growth, leadership, and entrepreneurship" },
  { id: "relationships", label: "Relationships", icon: Heart, color: "bg-pink-500", description: "Love, dating, social skills, and connection" },
  { id: "mental_health", label: "Mental Health", icon: Brain, color: "bg-purple-500", description: "Resilience, mindfulness, and emotional wellbeing" },
  { id: "finance", label: "Finance", icon: DollarSign, color: "bg-emerald-500", description: "Wealth building, budgeting, and financial freedom" },
  { id: "parenting", label: "Parenting", icon: Baby, color: "bg-orange-500", description: "Raising confident, resilient children" },
  { id: "gardening", label: "Gardening", icon: Flower2, color: "bg-lime-500", description: "Growing food, plants, and patience" },
  { id: "leadership", label: "Leadership", icon: Crown, color: "bg-amber-500", description: "Leading people, teams, and yourself" },
  { id: "creativity", label: "Creativity", icon: Palette, color: "bg-indigo-500", description: "Writing, art, music, and creative expression" },
  { id: "philosophy", label: "Philosophy", icon: BookOpen, color: "bg-slate-500", description: "Big questions, meaning, and examined living" },
  { id: "sleep", label: "Sleep & Recovery", icon: Moon, color: "bg-violet-500", description: "Better sleep, rest, and physical recovery" },
  { id: "productivity", label: "Productivity", icon: Timer, color: "bg-cyan-500", description: "Time management, focus, and getting things done" },
  { id: "communication", label: "Communication", icon: Mic, color: "bg-rose-500", description: "Public speaking, persuasion, and difficult conversations" },
  { id: "spirituality", label: "Spirituality", icon: Sparkles, color: "bg-amber-400", description: "Purpose, meaning, faith, and inner life" },
  { id: "education", label: "Education", icon: GraduationCap, color: "bg-sky-500", description: "Learning mastery, study skills, and knowledge" },
  { id: "style", label: "Style & Image", icon: Shirt, color: "bg-fuchsia-500", description: "Personal style, grooming, and self-presentation" },
  { id: "travel", label: "Travel & Adventure", icon: Plane, color: "bg-teal-500", description: "Exploration, adventure, and cultural immersion" },
  { id: "music", label: "Music", icon: Music, color: "bg-red-400", description: "Practice, performance, songwriting, and musical growth" },
  { id: "addiction", label: "Recovery & Habits", icon: Shield, color: "bg-stone-500", description: "Addiction recovery, behavior change, and healing" },
  { id: "longevity", label: "Longevity", icon: HeartPulse, color: "bg-green-400", description: "Healthy aging, vitality, and longevity science" },
  { id: "pets", label: "Pet Care", icon: PawPrint, color: "bg-yellow-500", description: "Dog training, pet wellness, and the human-animal bond" },
];

export function getDomain(id: string): Domain | undefined {
  return DOMAINS.find((d) => d.id === id);
}
