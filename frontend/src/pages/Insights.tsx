// ── Insights + Calendar — unified reflection page ───────────

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Flower2,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Feather,
  Flame,
  Droplets,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  subDays,
  getDay,
  parseISO,
  isToday,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodLog } from '@/hooks/useMoodLog';
import { useStreak } from '@/hooks/useStreak';
import { computeGardenNumbers, computeWrapped, computeDayInsights } from '@/lib/insights';
import { MOOD_OPTIONS } from '@/types/mood';
import '@/styles/insights.css';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Insights() {
  const navigate = useNavigate();
  const { entries } = useMoodLog();
  const streak = useStreak();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const numbers = useMemo(() => computeGardenNumbers(entries), [entries]);
  const wrapped = useMemo(() => computeWrapped(entries), [entries]);

  // Mood-per-day lookup for calendar colouring
  const moodMap = useMemo(() => {
    const map = new Map<string, { colour: string; mood: string }>();
    for (const entry of entries) {
      const key = entry.logged_date;
      if (!map.has(key)) {
        const opt = MOOD_OPTIONS.find((m) => m.type === entry.mood_type);
        if (opt) map.set(key, { colour: opt.colour, mood: opt.label });
      }
    }
    return map;
  }, [entries]);

  // Count entries per day for the dot indicator
  const countMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      map.set(entry.logged_date, (map.get(entry.logged_date) ?? 0) + 1);
    }
    return map;
  }, [entries]);

  // Calendar days
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startPad = getDay(days[0]);

  // Day drill-down insights
  const dayInsights = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return computeDayInsights(entries, dateStr);
  }, [entries, selectedDate]);

  // 16-week heatmap (112 days)
  const heatmapDays = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 111);
    return eachDayOfInterval({ start, end: today });
  }, []);

  const topMoodOption = MOOD_OPTIONS.find((m) => m.type === numbers.topMood);

  const handlePrevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const handleNextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);

  return (
    <div className="insights-page min-h-dvh">
      {/* ── Header ──────────────────────────────────── */}
      <header className="insights-header">
        <button
          onClick={() => navigate('/')}
          className="insights-back-btn"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="insights-title">reflect</h1>
          <p className="insights-subtitle">your garden story</p>
        </div>
      </header>

      <div className="insights-content">
        {/* ── Empty state when no entries ───────────── */}
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Feather size={36} className="text-latte/40" />
            <p className="text-sm text-ink/40 font-display text-center max-w-[200px]">
              log your first mood to see insights bloom here
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-4 py-2 rounded-xl bg-sage text-cream text-sm font-display font-bold"
            >
              plant your first mood
            </button>
          </div>
        )}

        {entries.length > 0 && (<>
        {/* ── Calendar section ─────────────────────── */}
        <section className="insights-calendar-section">
          {/* Month nav */}
          <div className="cal-month-nav">
            <button onClick={handlePrevMonth} className="cal-nav-btn" aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <h2 className="cal-month-label">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button onClick={handleNextMonth} className="cal-nav-btn" aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="cal-weekday-row">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="cal-weekday">{d}</span>
            ))}
          </div>

          {/* Day grid */}
          <div className="cal-grid">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="cal-cell-empty" />
            ))}

            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const moodInfo = moodMap.get(key);
              const entryCount = countMap.get(key) ?? 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`cal-cell ${isSelected ? 'cal-cell--selected' : ''} ${today ? 'cal-cell--today' : ''}`}
                  style={moodInfo ? { backgroundColor: `${moodInfo.colour}18` } : undefined}
                >
                  {moodInfo ? (
                    <span
                      className="cal-cell-dot"
                      style={{ backgroundColor: moodInfo.colour }}
                    />
                  ) : null}
                  <span className={`cal-cell-num ${moodInfo ? 'cal-cell-num--has-mood' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {entryCount > 1 && (
                    <span className="cal-cell-count">{entryCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Mood heatmap ────────────────────────── */}
        <section className="insights-heatmap-section">
          <h2 className="insights-section-heading">mood heatmap</h2>
          <p className="insights-section-sub">last 16 weeks</p>
          <div className="heatmap-scroll">
            <div className="heatmap-grid">
              {heatmapDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const moodInfo = moodMap.get(key);
                return (
                  <div
                    key={key}
                    className="heatmap-cell"
                    title={`${format(day, 'MMM d')}${moodInfo ? ` · ${moodInfo.mood}` : ''}`}
                    style={{
                      backgroundColor: moodInfo
                        ? moodInfo.colour
                        : 'rgba(61,47,36,0.06)',
                      opacity: moodInfo ? 0.85 : 1,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Day drill-down ──────────────────────── */}
        <AnimatePresence mode="wait">
          {selectedDate && dayInsights && (
            <motion.section
              key={format(selectedDate, 'yyyy-MM-dd')}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="day-drilldown"
            >
              <h3 className="day-drilldown-date">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h3>

              {dayInsights.entries.length === 0 ? (
                <div className="day-empty">
                  <Feather size={24} className="day-empty-icon" />
                  <p>no entries this day — your garden was resting</p>
                </div>
              ) : (
                <>
                  {/* Day mood summary strip */}
                  <div className="day-mood-strip">
                    {dayInsights.dominantMood && (
                      <div className="day-dominant">
                        <span
                          className="day-dominant-dot"
                          style={{
                            backgroundColor:
                              MOOD_OPTIONS.find((m) => m.type === dayInsights.dominantMood)?.colour,
                          }}
                        />
                        <span className="day-dominant-label">
                          {dayInsights.dominantMood}
                        </span>
                      </div>
                    )}
                    <div className="day-meta">
                      <span>{dayInsights.entries.length} log{dayInsights.entries.length !== 1 ? 's' : ''}</span>
                      <span className="day-meta-sep" />
                      <span>avg intensity {dayInsights.avgIntensity}</span>
                    </div>
                  </div>

                  {/* Day mood breakdown */}
                  {dayInsights.moodCounts.length > 1 && (
                    <div className="day-breakdown">
                      {dayInsights.moodCounts.map(({ mood, percent }) => {
                        const opt = MOOD_OPTIONS.find((m) => m.type === mood);
                        return (
                          <div key={mood} className="day-breakdown-bar-row">
                            <span className="day-breakdown-label">{mood}</span>
                            <div className="day-breakdown-track">
                              <motion.div
                                className="day-breakdown-fill"
                                style={{ backgroundColor: opt?.colour }}
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Day entries timeline */}
                  <div className="day-entries">
                    {dayInsights.entries
                      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
                      .map((entry) => {
                        const opt = MOOD_OPTIONS.find((m) => m.type === entry.mood_type);
                        return (
                          <div key={entry.id} className="day-entry-card">
                            <div className="day-entry-header">
                              <span
                                className="day-entry-pip"
                                style={{ backgroundColor: opt?.colour }}
                              />
                              <span className="day-entry-mood">{entry.mood_type}</span>
                              <span className="day-entry-intensity">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`day-entry-intensity-dot ${i < entry.intensity ? 'active' : ''}`}
                                    style={i < entry.intensity ? { backgroundColor: opt?.colour } : undefined}
                                  />
                                ))}
                              </span>
                              <span className="day-entry-time">
                                {format(parseISO(entry.logged_at), 'h:mm a')}
                              </span>
                            </div>
                            {entry.note && (
                              <p className="day-entry-note">{entry.note}</p>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Day notes */}
                  {dayInsights.notes.length > 0 && (
                    <div className="day-notes-summary">
                      <Feather size={14} />
                      <span>{dayInsights.notes.length} note{dayInsights.notes.length !== 1 ? 's' : ''} written</span>
                    </div>
                  )}
                </>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Overall stats ───────────────────────── */}
        <section className="insights-stats-section">
          <h2 className="insights-section-heading">your garden in numbers</h2>
          <div className="stats-grid">
            <StatCard
              icon={<Flower2 size={18} />}
              label="tiles planted"
              value={numbers.totalTiles}
              accent="var(--sage)"
              index={0}
            />
            <StatCard
              icon={<Droplets size={18} />}
              label="days logged"
              value={numbers.uniqueDays}
              accent="var(--mist)"
              index={1}
            />
            <StatCard
              icon={<Flame size={18} />}
              label="current streak"
              value={streak.current}
              accent="var(--terra)"
              index={2}
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="best streak"
              value={streak.longest}
              accent="var(--gold)"
              index={3}
            />
          </div>
        </section>

        {/* ── Top mood ────────────────────────────── */}
        {topMoodOption && (
          <motion.section
            className="insights-top-mood"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="insights-top-mood-label">most frequent mood</p>
            <div className="insights-top-mood-row">
              <span
                className="insights-top-mood-dot"
                style={{ backgroundColor: topMoodOption.colour }}
              />
              <span className="insights-top-mood-name">{topMoodOption.label}</span>
              <span className="insights-top-mood-pct">{numbers.topMoodPercent}%</span>
            </div>
          </motion.section>
        )}

        {/* ── Overall mood breakdown ──────────────── */}
        {numbers.moodCounts.length > 0 && (
          <motion.section
            className="insights-breakdown"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="insights-section-heading">mood tapestry</h2>
            <div className="breakdown-bars">
              {numbers.moodCounts.map(({ mood, count, percent }) => {
                const opt = MOOD_OPTIONS.find((m) => m.type === mood);
                return (
                  <div key={mood} className="breakdown-bar-row">
                    <span className="breakdown-bar-label">{mood}</span>
                    <div className="breakdown-bar-track">
                      <motion.div
                        className="breakdown-bar-fill"
                        style={{ backgroundColor: opt?.colour ?? 'var(--ink)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                      />
                    </div>
                    <span className="breakdown-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── Wrapped summary ─────────────────────── */}
        {wrapped && (
          <motion.section
            className="insights-wrapped"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="insights-wrapped-header">
              <Cloud size={16} />
              <span>garden wrapped</span>
            </div>
            <p className="insights-wrapped-text">{wrapped.summary}</p>
          </motion.section>
        )}

        {/* Bottom spacer */}
        <div className="h-8" />
        </>)}
      </div>
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  accent,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  index: number;
}) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="stat-card-icon" style={{ color: accent }}>{icon}</div>
      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
    </motion.div>
  );
}
