'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, MessageCircle, Star, User } from 'lucide-react';

const links = [
  { href: '/discover', icon: Flame, label: 'Discover' },
  { href: '/matches', icon: Star, label: 'Matches' },
  { href: '/messages', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav">
      {links.map(({ href, icon: Icon, label }) => {
        const active = path.startsWith(href);
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 py-1 px-4 transition-all">
            <Icon size={24} className={active ? 'text-[#FF4458]' : 'text-white/30'} strokeWidth={active ? 2.5 : 1.5} />
            <span className={`text-[10px] font-medium ${active ? 'text-[#FF4458]' : 'text-white/30'}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
