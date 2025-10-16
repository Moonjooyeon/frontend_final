import { create } from "zustand";

export const useNowPlayingStore = create((set) => ({
    isOpen: false,
    current: null,
    queue: [],
    playing: false,

    playTrack: (track, queue = []) =>
        set({ current: track, queue, isOpen: true, playing: true }),

    toggle: () => set((s) => ({ playing: !s.playing })),
    close: () => set({ isOpen: false, playing: false }),
    setPlaying: (v) => set({ playing: !!v }),
}));
