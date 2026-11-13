import React from 'react';
import {
  Atom,
  Briefcase,
  Car,
  Eye,
  Film,
  Fingerprint,
  Flame,
  Gamepad2,
  Gem,
  Ghost,
  GraduationCap,
  HeartCrack,
  Home,
  Layers,
  MapPin,
  MessageSquareQuote,
  Music,
  Package,
  PawPrint,
  Pizza,
  Plane,
  Scroll,
  Shield,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Trophy,
  Tv,
  Utensils,
  Wand2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { ClearanceTier } from '../types/game';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  PawPrint,
  Package,
  MapPin,
  Briefcase,
  Shirt,
  Home,
  Plane,
  Flame,
  HeartCrack,
  Fingerprint,
  Eye,
  Scroll,
  Wand2,
  Atom,
  MessageSquareQuote,
  Zap,
  ShoppingBag,
  Pizza,
  Smartphone,
  Trophy,
  Car,
  GraduationCap,
  Gem,
  Film,
  Tv,
  Gamepad2,
  Sparkles,
  Star,
  Shield,
  Music,
  Ghost,
  Layers,
};

interface DeckIconProps {
  name?: string;
  className?: string;
}

export const DeckIcon: React.FC<DeckIconProps> = ({
  name = 'Layers',
  className = 'h-4 w-4',
}) => {
  const IconComponent = ICON_MAP[name] || Layers;
  return <IconComponent className={className} />;
};

export function getDeckTierAccent(
  tier: ClearanceTier,
  isCustom?: boolean,
  isSpicy?: boolean
): { iconBg: string; iconText: string; badgeText: string } {
  if (isCustom) {
    return {
      iconBg: 'bg-purple-500/15 border-purple-500/40',
      iconText: 'text-purple-300',
      badgeText: 'text-purple-300',
    };
  }
  if (isSpicy || tier === 'classified') {
    return {
      iconBg: 'bg-crimson/15 border-crimson/40',
      iconText: 'text-crimson-glow',
      badgeText: 'text-crimson-glow',
    };
  }
  if (tier === 'pop_culture') {
    return {
      iconBg: 'bg-amber-tactical/15 border-amber-tactical/40',
      iconText: 'text-amber-tactical',
      badgeText: 'text-amber-tactical',
    };
  }
  if (tier === 'lifestyle') {
    return {
      iconBg: 'bg-sky-500/15 border-sky-500/40',
      iconText: 'text-sky-300',
      badgeText: 'text-sky-300',
    };
  }
  return {
    iconBg: 'bg-emerald-500/15 border-emerald-500/40',
    iconText: 'text-emerald-300',
    badgeText: 'text-emerald-300',
  };
}
