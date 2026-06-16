'use client';

import { Shield, Home, Wrench, Radio, HeartPulse, ChevronRight } from 'lucide-react';
import type { PreventionAction, PreventionCategory } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<
  PreventionCategory,
  { label: string; icon: typeof Shield; color: string }
> = {
  evakuasi: { label: 'Evakuasi', icon: Home, color: 'text-red-400' },
  mitigasi: { label: 'Mitigasi', icon: Wrench, color: 'text-yellow-400' },
  infrastruktur: { label: 'Infrastruktur', icon: Wrench, color: 'text-orange-400' },
  komunikasi: { label: 'Komunikasi', icon: Radio, color: 'text-blue-400' },
  kesehatan: { label: 'Kesehatan', icon: HeartPulse, color: 'text-green-400' },
};

const PRIORITY_BADGE: Record<string, string> = {
  tinggi: 'bg-red-500/15 text-red-400 border-red-500/30',
  sedang: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  rendah: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

interface PreventionPanelProps {
  actions: PreventionAction[];
  compact?: boolean;
  className?: string;
}

export function PreventionPanel({ actions, compact = false, className }: PreventionPanelProps) {
  if (actions.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Shield size={14} className="text-primary" />
        Tindakan Pencegahan & Mitigasi
      </div>
      <div className={cn('space-y-2', compact && 'max-h-48 overflow-y-auto scrollbar-thin')}>
        {actions.map((action) => {
          const cat = CATEGORY_CONFIG[action.category];
          const Icon = cat.icon;
          return (
            <div
              key={action.id}
              className="rounded-lg border border-border/60 bg-muted/20 p-3 flex gap-3"
            >
              <div className={cn('p-1.5 rounded-md bg-muted/40 h-fit shrink-0', cat.color)}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium">{action.title}</p>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase',
                      PRIORITY_BADGE[action.priority]
                    )}
                  >
                    {action.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
                <p className={cn('text-[10px] mt-1', cat.color)}>{cat.label}</p>
              </div>
              {!compact && <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
