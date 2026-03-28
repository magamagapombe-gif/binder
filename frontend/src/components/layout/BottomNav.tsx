'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, MessageCircle, Star, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

const links = [
  { href: '/discover', icon: Flame, label: 'Discover' },
  { href: '/matches', icon: Star, label: 'Matches' },
  { href: '/messages', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    function fetchUnread() {
      api.getMatches().then((matches: any[]) => {
        const total = (matches || []).reduce((sum: number, m: any) => sum + (m.unread_count || 0), 0);
        setUnread(total);
      }).catch(() => {});
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bottom-nav">
      {links.map(({ href, icon: Icon, label }) => {
        const active = path.startsWith(href);
        const showBadge = href === '/messages' && unread > 0;
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-1 py-1 px-4 transition-all relative">
            <div className="relative">
              <Icon size={24}
                className={active ? 'text-[#FF4458]' : 'text-white/30'}
                strokeWidth={active ? 2.5 : 1.5} />
              {showBadge && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF4458] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>
                </motion.div>
              )}
            </div>
            <span className={`text-[10px] font-medium ${active ? 'text-[#FF4458]' : 'text-white/30'}`}>
              {label}
            </span>
            {active && (
              <motion.div layoutId="nav-indicator"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#FF4458]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
