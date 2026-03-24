// ── Animal care — floating pet & feed panel ─────────────────

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles } from 'lucide-react';

/* ── Animal types with their details ──────────────────────── */
const ANIMALS = [
  { type: 'bird',      name: 'Little Wren',     colour: '#C4956A' },
  { type: 'bunny',     name: 'Clover',          colour: '#B89AB8' },
  { type: 'butterfly', name: 'Flutter',          colour: '#D4876A' },
  { type: 'cat',       name: 'Mochi',            colour: '#E8C84A' },
] as const;

/* ── Tiny SVG animals (no emoji) ──────────────────────────── */
function AnimalIcon({ type, size = 28 }: { type: string; size?: number }) {
  const s = size;
  switch (type) {
    case 'bird':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <ellipse cx="16" cy="18" rx="9" ry="7" fill="#C4956A" opacity="0.2" />
          <ellipse cx="16" cy="18" rx="9" ry="7" stroke="#C4956A" strokeWidth="1.5" fill="none" />
          <circle cx="12" cy="16" r="1" fill="#3D2F24" />
          <path d="M8 18l-3 2" stroke="#C4956A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M20 15c2-3 6-3 7-1" stroke="#C4956A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 21c1 1 7 1 8 0" stroke="#C4956A" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case 'bunny':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <ellipse cx="16" cy="20" rx="8" ry="7" fill="#B89AB8" opacity="0.15" />
          <ellipse cx="16" cy="20" rx="8" ry="7" stroke="#B89AB8" strokeWidth="1.5" fill="none" />
          <ellipse cx="12" cy="9" rx="2.5" ry="6" stroke="#B89AB8" strokeWidth="1.5" fill="none" transform="rotate(-10 12 9)" />
          <ellipse cx="20" cy="9" rx="2.5" ry="6" stroke="#B89AB8" strokeWidth="1.5" fill="none" transform="rotate(10 20 9)" />
          <ellipse cx="12" cy="9" rx="1.5" ry="4" fill="#B89AB8" opacity="0.1" transform="rotate(-10 12 9)" />
          <ellipse cx="20" cy="9" rx="1.5" ry="4" fill="#B89AB8" opacity="0.1" transform="rotate(10 20 9)" />
          <circle cx="13" cy="18" r="1" fill="#3D2F24" />
          <circle cx="19" cy="18" r="1" fill="#3D2F24" />
          <ellipse cx="16" cy="21" rx="1.5" ry="1" fill="#B89AB8" opacity="0.3" />
        </svg>
      );
    case 'butterfly':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <ellipse cx="10" cy="14" rx="6" ry="5" fill="#D4876A" opacity="0.15" stroke="#D4876A" strokeWidth="1.5" transform="rotate(-15 10 14)" />
          <ellipse cx="22" cy="14" rx="6" ry="5" fill="#D4876A" opacity="0.15" stroke="#D4876A" strokeWidth="1.5" transform="rotate(15 22 14)" />
          <ellipse cx="12" cy="22" rx="4" ry="3" fill="#D4876A" opacity="0.1" stroke="#D4876A" strokeWidth="1.5" transform="rotate(-10 12 22)" />
          <ellipse cx="20" cy="22" rx="4" ry="3" fill="#D4876A" opacity="0.1" stroke="#D4876A" strokeWidth="1.5" transform="rotate(10 20 22)" />
          <line x1="16" y1="10" x2="16" y2="26" stroke="#3D2F24" strokeWidth="1.5" />
          <path d="M16 10c-2-4-1-6 0-7" stroke="#3D2F24" strokeWidth="1" strokeLinecap="round" />
          <path d="M16 10c2-4 1-6 0-7" stroke="#3D2F24" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case 'cat':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <ellipse cx="16" cy="20" rx="9" ry="7" fill="#E8C84A" opacity="0.12" />
          <ellipse cx="16" cy="20" rx="9" ry="7" stroke="#E8C84A" strokeWidth="1.5" fill="none" />
          <path d="M8 14l-2-7 5 4" stroke="#E8C84A" strokeWidth="1.5" strokeLinejoin="round" fill="#E8C84A" fillOpacity="0.1" />
          <path d="M24 14l2-7-5 4" stroke="#E8C84A" strokeWidth="1.5" strokeLinejoin="round" fill="#E8C84A" fillOpacity="0.1" />
          <circle cx="12" cy="18" r="1" fill="#3D2F24" />
          <circle cx="20" cy="18" r="1" fill="#3D2F24" />
          <path d="M14 21c1 1 3 1 4 0" stroke="#3D2F24" strokeWidth="1" strokeLinecap="round" />
          <path d="M8 20c-3-1-4 0-5 1" stroke="#E8C84A" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <path d="M8 21c-3 0-4 1-5 1" stroke="#E8C84A" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <path d="M24 20c3-1 4 0 5 1" stroke="#E8C84A" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <path d="M24 21c3 0 4 1 5 1" stroke="#E8C84A" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Heart burst particles ────────────────────────────────── */
function HeartBurst({ colour }: { colour: string }) {
  return (
    <div className="ac-burst">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="ac-burst-heart"
          initial={{
            opacity: 1,
            scale: 0.5,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: 0,
            scale: 1.2,
            x: (Math.cos((i / 6) * Math.PI * 2) * 30),
            y: (Math.sin((i / 6) * Math.PI * 2) * 30) - 10,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Heart size={10} fill={colour} color={colour} />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Main animal care component ───────────────────────────── */
export function AnimalCare() {
  const [isOpen, setIsOpen] = useState(false);
  const [pettedAnimal, setPettedAnimal] = useState<string | null>(null);
  const [happiness, setHappiness] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('bloom-animal-happiness');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    const h: Record<string, number> = {};
    ANIMALS.forEach((a) => (h[a.type] = 2));
    return h;
  });

  useEffect(() => {
    localStorage.setItem('bloom-animal-happiness', JSON.stringify(happiness));
  }, [happiness]);

  const handlePet = useCallback((type: string) => {
    setPettedAnimal(type);
    setHappiness((prev) => ({
      ...prev,
      [type]: Math.min(5, (prev[type] ?? 2) + 1),
    }));
    setTimeout(() => setPettedAnimal(null), 1000);
  }, []);

  return (
    <>
      {/* ── Toggle button ──────────────────────────── */}
      <motion.button
        className="ac-toggle"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <Heart size={14} fill={isOpen ? 'var(--terra)' : 'none'} color="var(--terra)" />
      </motion.button>

      {/* ── Panel ──────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ac-panel"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          >
            <div className="ac-panel-header">
              <Sparkles size={12} className="text-gold/60" />
              <span className="ac-panel-title">garden friends</span>
              <button onClick={() => setIsOpen(false)} className="ac-panel-close">
                <X size={12} />
              </button>
            </div>

            <div className="ac-grid">
              {ANIMALS.map((animal) => {
                const isPetted = pettedAnimal === animal.type;
                const hearts = happiness[animal.type] ?? 2;
                return (
                  <motion.button
                    key={animal.type}
                    className="ac-animal-card"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePet(animal.type)}
                  >
                    <div className="ac-animal-icon-wrap" style={{ borderColor: animal.colour + '30' }}>
                      <AnimalIcon type={animal.type} size={32} />
                      <AnimatePresence>
                        {isPetted && <HeartBurst colour={animal.colour} />}
                      </AnimatePresence>
                    </div>
                    <span className="ac-animal-name">{animal.name}</span>
                    <div className="ac-hearts">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Heart
                          key={i}
                          size={7}
                          fill={i <= hearts ? animal.colour : 'transparent'}
                          color={i <= hearts ? animal.colour : 'rgba(61,47,36,0.15)'}
                        />
                      ))}
                    </div>
                    <span className="ac-pet-label">
                      {isPetted ? 'happy!' : 'tap to pet'}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
