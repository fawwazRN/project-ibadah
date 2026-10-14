import { BookOpen, Brain, Coffee, Flag, HeartHandshake, Home, MessagesSquare, Moon, ShieldCheck, Sparkles, Sun, Users } from "lucide-react";

// Pengganti emoji: nilai disimpan di kolom topic_emoji sebagai kunci ikon.
export const TOPIC_ICONS = {
  chat: { icon: MessagesSquare, label: "Obrolan" },
  coffee: { icon: Coffee, label: "Santai" },
  book: { icon: BookOpen, label: "Belajar / Ujian" },
  heart: { icon: HeartHandshake, label: "Hati / Curhat" },
  home: { icon: Home, label: "Rumah" },
  users: { icon: Users, label: "Pertemanan" },
  brain: { icon: Brain, label: "Pikiran" },
  moon: { icon: Moon, label: "Malam / Tidur" },
  sun: { icon: Sun, label: "Semangat" },
  spark: { icon: Sparkles, label: "Ibadah" },
  shield: { icon: ShieldCheck, label: "Disiplin" },
  flag: { icon: Flag, label: "Target" },
};

export function TopicIcon({ name, size = 28, strokeWidth = 2.4, className = "" }) {
  const Icon = (TOPIC_ICONS[name] ?? TOPIC_ICONS.chat).icon; // nilai lama (emoji) → ikon obrolan
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
