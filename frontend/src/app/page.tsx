'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';

export default function Home() {
  const router = useRouter();
  const { token, profile } = useStore();

  useEffect(() => {
    if (!token) router.replace('/auth');
    else if (!profile?.name) router.replace('/onboarding');
    else router.replace('/discover');
  }, [token, profile]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#FF4458] border-t-transparent animate-spin" />
    </div>
  );
}
