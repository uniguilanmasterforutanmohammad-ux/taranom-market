import {
  BarChart3,
  Bell,
  CreditCard,
  Crown,
  HeartHandshake,
  PackageCheck,
  PackagePlus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Users,
  Wallet,
  Sparkles,
  MessageCircle,
  Reply,
  ContactRound,
} from "lucide-react";

const ICONS = {
  Store,
  PackagePlus,
  ShieldCheck,
  HeartHandshake,
  Users,
  Crown,
  BarChart3,
  Star,
  Bell,
  ShoppingCart,
  CreditCard,
  PackageCheck,
  Wallet,
  MessageCircle,
  Reply,
  ContactRound,
} as const;

export function ModuleIcon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Sparkles;
  return <Icon size={size} className={className} aria-hidden />;
}
