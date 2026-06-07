"use client";

import { LucideIcon } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionIcon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <Icon size={24} className="text-[#8A7A5A]" />
      </div>
      <h3 className="text-lg font-sans font-medium text-white mb-2">{title}</h3>
      <p className="text-[#8A7A5A] text-sm font-sans mb-8 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-3 rounded-full bg-[#C9A96E] text-black font-sans font-medium text-sm hover:bg-[#E8D4A6] transition-colors flex items-center gap-2"
        >
          {actionLabel} {actionIcon}
        </button>
      )}
    </div>
  );
}
