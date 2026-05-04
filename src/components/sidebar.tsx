"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderGit2, 
  HelpCircle, 
  Settings, 
  LogOut,
  ChevronRight,
  User,
  Leaf,
  Terminal
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Studio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Repositories', href: '/projects', icon: FolderGit2 },
  { name: 'Documentation', href: '/how-it-works', icon: HelpCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [hash, setHash] = React.useState('');

  React.useEffect(() => {
    setHash(window.location.hash);
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    const handlePopState = () => setHash(window.location.hash);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // HIDE SIDEBAR ON LANDING PAGE
  if (pathname === '/' || !user) return null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-[#050505] border-r border-white/5 flex flex-col z-[200] transition-all duration-300 group">
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-grain opacity-5 pointer-events-none" />

      {/* Logo */}
      <div className="p-8 mb-4 relative z-10">
        <Link href="/dashboard" className="flex flex-col items-start gap-2 group/logo">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center group-hover/logo:rotate-12 transition-all duration-500 shadow-[0_0_20px_rgba(163,230,53,0.1)]">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="font-black text-xl tracking-tighter leading-none hidden lg:block">JobSeed</span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary mt-1 opacity-50 hidden lg:block ml-1">V1.0_Studio</span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-2 relative z-10">
        {navItems.map((item) => {
          const itemPath = item.href.split('#')[0];
          const itemHash = item.href.includes('#') ? '#' + item.href.split('#')[1] : '';
          
          const isActive = itemHash 
            ? pathname === itemPath && hash === itemHash
            : pathname === itemPath && !hash;

          return (
            <Link key={item.name} href={item.href} onClick={() => setHash(itemHash)}>
              <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-500 group/item ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_30px_rgba(163,230,53,0.1)]' 
                  : 'text-gray-600 hover:text-white hover:bg-white/5 border border-transparent'
              }`}>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'group-hover/item:scale-110 transition-transform'}`} />
                <span className="font-black text-[10px] uppercase tracking-[0.2em] hidden lg:block">{item.name}</span>
                {isActive && <div className="ml-auto hidden lg:block h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_rgba(163,230,53,1)]" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User & Footer */}
      <div className="p-6 mt-auto border-t border-white/5 space-y-6 relative z-10">
        <div className="hidden lg:block px-5 py-4 bg-white/[0.02] rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-white/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase tracking-tighter truncate">{user.email?.split('@')[0]}</div>
              <div className="text-[8px] text-primary/50 font-black uppercase tracking-[0.2em] mt-1 italic">{profile?.plan ?? 'Free'} Tier</div>
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={signOut}
          className="w-full flex items-center justify-center lg:justify-start gap-4 h-14 px-5 text-gray-600 hover:text-red-400 hover:bg-red-500/5 rounded-2xl group/logout transition-all duration-500"
        >
          <LogOut className="h-5 w-5 group-hover/logout:-translate-x-1 transition-transform" />
          <span className="font-black text-[10px] uppercase tracking-[0.2em] hidden lg:block">Terminate_Session</span>
        </Button>
      </div>
    </aside>
  );
}
