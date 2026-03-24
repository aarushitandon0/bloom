// ── Streak badge component ──────────────────────────────────

import { Flame } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';

export function StreakBadge() {
  const { current } = useStreak();

  if (current === 0) return null;

  return (
    <div className="
      inline-flex items-center gap-1.5
      bg-cream rounded-full px-3 py-1
      border border-terra/20
      text-sm font-display font-semibold text-terra
    ">
      <Flame size={14} className="text-terra" />
      <span>{current}</span>
    </div>
  );
}
