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
];

export function getDomain(id: string): Domain | undefined {
  return DOMAINS.find((d) => d.id === id);
}
