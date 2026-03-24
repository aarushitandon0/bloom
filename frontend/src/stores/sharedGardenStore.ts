// ── Shared Garden Store ─────────────────────────────────────
// Two friends co-grow a garden, each planting from their own moods.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SharedMember {
  userId: string;
  displayName: string;
  color: string; // accent color for this member's tiles
  joinedAt: string;
}

export interface SharedTile {
  id: string;
  userId: string;        // which member planted this
  tileType: string;
  gridCol: number;
  gridRow: number;
  placedAt: string;
  mood: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  sentAt: string;
}

export interface SharedGarden {
  id: string;
  code: string;          // 6-char invite code
  name: string;
  createdAt: string;
  members: SharedMember[];
  tiles: SharedTile[];
  chat: ChatMessage[];
}

interface SharedGardenState {
  gardens: SharedGarden[];
  activeCode: string | null;

  createGarden: (name: string, userId: string, displayName: string) => SharedGarden;
  joinGarden: (code: string, userId: string, displayName: string) => SharedGarden | null;
  setActive: (code: string | null) => void;
  plantTile: (code: string, userId: string, tileType: string, mood: string, col: number, row: number) => void;
  sendMessage: (code: string, userId: string, displayName: string, text: string) => void;
  getGarden: (code: string) => SharedGarden | undefined;
}

const MEMBER_COLORS = ['#8BAF7A', '#B89AB8', '#C4956A', '#9AB0C4', '#E8C84A', '#D4876A'];

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const useSharedGardenStore = create<SharedGardenState>()(
  persist(
    (set, get) => ({
      gardens: [],
      activeCode: null,

      createGarden(name, userId, displayName) {
        const code = generateCode();
        const color = MEMBER_COLORS[0];
        const garden: SharedGarden = {
          id: `sg-${Date.now()}`,
          code,
          name,
          createdAt: new Date().toISOString(),
          members: [{ userId, displayName, color, joinedAt: new Date().toISOString() }],
          tiles: [],
          chat: [],
        };
        set((s) => ({ gardens: [...s.gardens, garden], activeCode: code }));
        return garden;
      },

      joinGarden(code, userId, displayName) {
        const garden = get().gardens.find((g) => g.code === code);
        if (!garden) return null;
        // Already a member?
        if (garden.members.find((m) => m.userId === userId)) {
          set({ activeCode: code });
          return garden;
        }
        if (garden.members.length >= 4) return null; // max 4 friends
        const color = MEMBER_COLORS[garden.members.length % MEMBER_COLORS.length];
        const newMember: SharedMember = { userId, displayName, color, joinedAt: new Date().toISOString() };
        set((s) => ({
          gardens: s.gardens.map((g) =>
            g.code === code ? { ...g, members: [...g.members, newMember] } : g
          ),
          activeCode: code,
        }));
        return get().gardens.find((g) => g.code === code) ?? null;
      },

      setActive(code) {
        set({ activeCode: code });
      },

      plantTile(code, userId, tileType, mood, col, row) {
        const tile: SharedTile = {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId,
          tileType,
          gridCol: col,
          gridRow: row,
          placedAt: new Date().toISOString(),
          mood,
        };
        set((s) => ({
          gardens: s.gardens.map((g) =>
            g.code === code
              ? {
                  ...g,
                  tiles: [
                    ...g.tiles.filter((t) => !(t.gridCol === col && t.gridRow === row)),
                    tile,
                  ],
                }
              : g
          ),
        }));
      },

      sendMessage(code, userId, displayName, text) {
        const msg: ChatMessage = {
          id: `cm-${Date.now()}`,
          userId,
          displayName,
          text: text.trim(),
          sentAt: new Date().toISOString(),
        };
        set((s) => ({
          gardens: s.gardens.map((g) =>
            g.code === code ? { ...g, chat: [...g.chat, msg] } : g
          ),
        }));
      },

      getGarden(code) {
        return get().gardens.find((g) => g.code === code);
      },
    }),
    { name: 'bloom-shared-gardens' }
  )
);
