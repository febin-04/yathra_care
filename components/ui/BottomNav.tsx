'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Search, LayoutDashboard, HelpCircle } from 'lucide-react';

import { useLanguage } from '@/context/LanguageContext';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items: NavItem[] = [
    { label: t.reportGrievance, href: '/#form', icon: <FileText className="w-5 h-5" /> },
    { label: t.trackStatus, href: '/track', icon: <Search className="w-5 h-5" /> },
    { label: t.depotDashboard, href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: t.help, href: '/help', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-mobile-border shadow-floating z-50 px-3 py-2">
      <div className="flex justify-around items-center">
        {items.map((item) => {
          const isActive =
            item.href === '/' || item.href === '/#form'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (item.href === '/#form' && pathname === '/') {
                  const el = document.getElementById('form');
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
              className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-mobile-header font-black scale-105'
                  : 'text-mobile-subtext font-medium hover:text-slate-800'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-mobile-cardTint text-mobile-header shadow-sm' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-extrabold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
