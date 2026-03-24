// ── Shared Garden page ────────────────────────────────────────
// Create or join a garden with friends. Each member plants their mood tiles.

import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Plus, Copy, Check, Send, Flower2,
  LogIn, Leaf,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useSharedGardenStore } from '@/stores/sharedGardenStore';
import { useAuthStore } from '@/stores/authStore';
import { MOOD_OPTIONS } from '@/types/mood';
import '@/styles/shared-garden.css';

/* ── helpers ───────────────────────────────────────────── */
const GRID = 6;

/* ── Isometric mini-garden grid ───────────────────────── */
function GardenGrid({
  tiles,
  memberColors,
  onTileClick,
}: {
  tiles: Array<{ gridCol: number; gridRow: number; userId: string; tileType: string; mood: string }>;
  memberColors: Record<string, string>;
  onTileClick?: (col: number, row: number) => void;
}) {
  const cells = useMemo(() => {
    const map = new Map<string, (typeof tiles)[0]>();
    tiles.forEach((t) => map.set(`${t.gridCol},${t.gridRow}`, t));
    return map;
  }, [tiles]);

  return (
    <div className="sg-garden-grid" style={{ '--grid': GRID } as React.CSSProperties}>
      {Array.from({ length: GRID }).map((_, row) =>
        Array.from({ length: GRID }).map((_, col) => {
          const key = `${col},${row}`;
          const tile = cells.get(key);
          const color = tile ? (memberColors[tile.userId] ?? '#8BAF7A') : undefined;
          const opt = tile ? MOOD_OPTIONS.find((m) => m.type === tile.mood) : undefined;
          return (
            <button
              key={key}
              className={`sg-grid-cell ${tile ? 'sg-grid-cell--planted' : ''}`}
              style={color ? { borderColor: color, backgroundColor: `${color}22` } : undefined}
              onClick={() => onTileClick?.(col, row)}
              title={opt ? opt.label : 'empty plot'}
            >
              {tile && (
                <span className="sg-grid-cell-dot" style={{ backgroundColor: color }} />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

/* ── Garden view (once inside a garden) ─────────────────── */
function GardenView({ code }: { code: string }) {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const userId = profile?.id ?? 'anon';
  const displayName = profile?.garden_name ?? 'Friend';

  const { plantTile, sendMessage } = useSharedGardenStore();
  const garden = useSharedGardenStore((s) => s.gardens.find((g) => g.code === code));

  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [plantingMood, setPlantingMood] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const memberColors = useMemo(() => {
    const map: Record<string, string> = {};
    garden?.members.forEach((m) => { map[m.userId] = m.color; });
    return map;
  }, [garden]);

  const myColor = memberColors[userId] ?? '#8BAF7A';

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [code]);

  const handleCellClick = useCallback((col: number, row: number) => {
    setSelectedCell({ col, row });
    setPlantingMood(null);
  }, []);

  const handlePlant = useCallback(() => {
    if (!selectedCell || !plantingMood) return;
    const opt = MOOD_OPTIONS.find((m) => m.type === plantingMood);
    if (!opt) return;
    plantTile(code, userId, `${plantingMood}_standard`, plantingMood, selectedCell.col, selectedCell.row);
    setSelectedCell(null);
    setPlantingMood(null);
  }, [selectedCell, plantingMood, code, userId, plantTile]);

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    sendMessage(code, userId, displayName, chatInput.trim());
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [chatInput, code, userId, displayName, sendMessage]);

  if (!garden) {
    return (
      <div className="sg-page">
        <p className="sg-empty-text">Garden not found.</p>
      </div>
    );
  }

  return (
    <div className="sg-page">
      {/* Header */}
      <header className="sg-header">
        <button onClick={() => navigate('/shared-garden')} className="sg-back-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="sg-title">{garden.name}</h1>
          <p className="sg-subtitle">{garden.members.length} friend{garden.members.length !== 1 ? 's' : ''} growing together</p>
        </div>
        <button className="sg-code-btn" onClick={handleCopyCode} title="Copy invite code">
          {copiedCode ? <Check size={14} /> : <Copy size={14} />}
          <span>{code}</span>
        </button>
      </header>

      <div className="sg-body">
        {/* Member avatars */}
        <div className="sg-members-row">
          {garden.members.map((m) => (
            <div key={m.userId} className="sg-member-chip" style={{ borderColor: m.color }}>
              <span className="sg-member-dot" style={{ backgroundColor: m.color }} />
              <span className="sg-member-name">{m.displayName}</span>
              {m.userId === userId && <span className="sg-member-you">you</span>}
            </div>
          ))}
        </div>

        {/* Garden grid */}
        <section className="sg-garden-section">
          <GardenGrid
            tiles={garden.tiles}
            memberColors={memberColors}
            onTileClick={handleCellClick}
          />

          {/* Plant mood picker */}
          <AnimatePresence>
            {selectedCell && (
              <motion.div
                className="sg-plant-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
              >
                <p className="sg-plant-panel-title">
                  plant at ({selectedCell.col}, {selectedCell.row}) — pick a mood
                </p>
                <div className="sg-mood-grid">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.type}
                      className={`sg-mood-btn ${plantingMood === m.type ? 'sg-mood-btn--active' : ''}`}
                      style={{ borderColor: plantingMood === m.type ? m.colour : 'transparent', color: m.colour }}
                      onClick={() => setPlantingMood(m.type)}
                    >
                      <span className="sg-mood-dot" style={{ backgroundColor: m.colour }} />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
                <div className="sg-plant-actions">
                  <button
                    className="sg-plant-confirm"
                    disabled={!plantingMood}
                    style={{ backgroundColor: myColor }}
                    onClick={handlePlant}
                  >
                    <Leaf size={13} />
                    <span>plant</span>
                  </button>
                  <button className="sg-plant-cancel" onClick={() => setSelectedCell(null)}>
                    cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Stats row */}
        <div className="sg-stats-row">
          <div className="sg-stat">
            <Flower2 size={14} />
            <span>{garden.tiles.length} total plant{garden.tiles.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="sg-stat">
            <Users size={14} />
            <span>{garden.members.length} member{garden.members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Garden tile legend */}
        {garden.tiles.length > 0 && (
          <div className="sg-legend">
            {garden.members.map((m) => {
              const count = garden.tiles.filter((t) => t.userId === m.userId).length;
              if (count === 0) return null;
              return (
                <div key={m.userId} className="sg-legend-item">
                  <span className="sg-legend-dot" style={{ backgroundColor: m.color }} />
                  <span>{m.displayName}: {count} plant{count !== 1 ? 's' : ''}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Chat */}
        <section className="sg-chat-section">
          <h2 className="sg-chat-title">garden notes</h2>
          <div className="sg-chat-messages">
            {garden.chat.length === 0 ? (
              <p className="sg-chat-empty">no notes yet — say something kind</p>
            ) : (
              garden.chat.map((msg) => {
                const isMe = msg.userId === userId;
                const color = memberColors[msg.userId] ?? '#8BAF7A';
                return (
                  <div key={msg.id} className={`sg-msg ${isMe ? 'sg-msg--me' : ''}`}>
                    {!isMe && (
                      <span className="sg-msg-name" style={{ color }}>{msg.displayName}</span>
                    )}
                    <div className="sg-msg-bubble" style={isMe ? { backgroundColor: `${myColor}22`, borderColor: `${myColor}44` } : undefined}>
                      {msg.text}
                    </div>
                    <span className="sg-msg-time">{format(parseISO(msg.sentAt), 'h:mm a')}</span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="sg-chat-input-row">
            <input
              className="sg-chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="write a note..."
              maxLength={200}
            />
            <button
              className="sg-chat-send"
              style={{ backgroundColor: myColor }}
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Landing: list & create/join ─────────────────────────── */
export default function SharedGarden() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const userId = profile?.id ?? 'anon';
  const displayName = profile?.garden_name ?? 'Friend';

  const { gardens, createGarden, joinGarden } = useSharedGardenStore();

  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list');
  const [gardenName, setGardenName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  // Deep-link: /shared-garden/:code
  if (code) return <GardenView code={code.toUpperCase()} />;

  const handleCreate = () => {
    if (!gardenName.trim()) { setError('give your garden a name'); return; }
    const g = createGarden(gardenName.trim(), userId, displayName);
    navigate(`/shared-garden/${g.code}`);
  };

  const handleJoin = () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length !== 6) { setError('invite code should be 6 characters'); return; }
    const g = joinGarden(trimmed, userId, displayName);
    if (!g) { setError('garden not found — double-check the code'); return; }
    navigate(`/shared-garden/${g.code}`);
  };

  return (
    <div className="sg-page">
      {/* Header */}
      <header className="sg-header">
        <button onClick={() => navigate('/')} className="sg-back-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="sg-title">friend gardens</h1>
          <p className="sg-subtitle">grow together</p>
        </div>
      </header>

      <div className="sg-body">
        {/* Action buttons */}
        {mode === 'list' && (
          <div className="sg-action-row">
            <motion.button
              className="sg-action-btn sg-action-btn--create"
              whileTap={{ scale: 0.97 }}
              onClick={() => { setMode('create'); setError(''); }}
            >
              <Plus size={16} />
              <span>create garden</span>
            </motion.button>
            <motion.button
              className="sg-action-btn sg-action-btn--join"
              whileTap={{ scale: 0.97 }}
              onClick={() => { setMode('join'); setError(''); }}
            >
              <LogIn size={16} />
              <span>join with code</span>
            </motion.button>
          </div>
        )}

        {/* Create form */}
        <AnimatePresence mode="wait">
          {mode === 'create' && (
            <motion.div
              className="sg-form-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <h2 className="sg-form-title">name your garden</h2>
              <input
                className="sg-input"
                value={gardenName}
                onChange={(e) => setGardenName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. our secret garden"
                autoFocus
                maxLength={40}
              />
              {error && <p className="sg-error">{error}</p>}
              <div className="sg-form-actions">
                <button className="sg-confirm-btn" onClick={handleCreate}>
                  <Flower2 size={14} />
                  <span>create & get invite code</span>
                </button>
                <button className="sg-cancel-link" onClick={() => { setMode('list'); setError(''); }}>
                  cancel
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div
              className="sg-form-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <h2 className="sg-form-title">enter invite code</h2>
              <input
                className="sg-input sg-input--code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="ABC123"
                maxLength={6}
                autoFocus
              />
              {error && <p className="sg-error">{error}</p>}
              <div className="sg-form-actions">
                <button className="sg-confirm-btn" onClick={handleJoin}>
                  <LogIn size={14} />
                  <span>join garden</span>
                </button>
                <button className="sg-cancel-link" onClick={() => { setMode('list'); setError(''); }}>
                  cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing gardens */}
        {gardens.length > 0 && mode === 'list' && (
          <div className="sg-gardens-list">
            <h2 className="sg-list-heading">your shared gardens</h2>
            {gardens.map((g) => (
              <motion.button
                key={g.id}
                className="sg-garden-card"
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/shared-garden/${g.code}`)}
              >
                <div className="sg-garden-card-left">
                  <div className="sg-garden-card-avatars">
                    {g.members.slice(0, 3).map((m) => (
                      <span key={m.userId} className="sg-avatar-dot" style={{ backgroundColor: m.color }} />
                    ))}
                  </div>
                  <div>
                    <p className="sg-garden-card-name">{g.name}</p>
                    <p className="sg-garden-card-meta">
                      {g.members.length} member{g.members.length !== 1 ? 's' : ''} · {g.tiles.length} plants
                    </p>
                  </div>
                </div>
                <span className="sg-garden-card-code">{g.code}</span>
              </motion.button>
            ))}
          </div>
        )}

        {gardens.length === 0 && mode === 'list' && (
          <div className="sg-empty-state">
            <div className="sg-empty-icon">
              <Users size={32} />
            </div>
            <p className="sg-empty-title">no shared gardens yet</p>
            <p className="sg-empty-sub">
              create one and share the invite code with a friend to start growing together
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
