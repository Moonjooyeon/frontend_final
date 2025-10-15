// playlistStore.js
import { create } from 'zustand';

export const usePlaylistStore = create((set, get) => {
    const read = () => JSON.parse(localStorage.getItem("playlists") || "[]");
    const write = (updated) => {
        localStorage.setItem("playlists", JSON.stringify(updated));
        set({ playlists: updated });
    };

    return {
        playlists: read(),

        // 플레이리스트 추가
        addPlaylist: (name) => {
            const newList = { id: Date.now(), name, tracks: [] };
            const updated = [...get().playlists, newList];
            write(updated);
        },

        // 트랙 추가
        addTrack: (playlistId, track) => {
            const updated = get().playlists.map(p =>
                p.id === playlistId ? { ...p, tracks: [...(p.tracks || []), track] } : p
            );
            write(updated);
        },

        // ✅ 트랙 전체 세팅(더미 시드 후 교체 등에 사용)
        setTracks: (playlistId, tracks) => {
            const updated = get().playlists.map(p =>
                p.id === playlistId ? { ...p, tracks: tracks || [] } : p
            );
            write(updated);
        },

        // ✅ 단일 트랙 삭제
        removeTrack: (playlistId, trackId) => {
            const updated = get().playlists.map(p =>
                p.id === playlistId
                    ? { ...p, tracks: (p.tracks || []).filter(t => t.id !== trackId) }
                    : p
            );
            write(updated);
        },

        // 플레이리스트 삭제
        deletePlaylist: (playlistId) => {
            const updated = get().playlists.filter(p => p.id !== playlistId);
            write(updated);
        },

        // 플레이리스트 이름 변경
        updatePlaylist: (id, newName) => {
            const updated = get().playlists.map(p =>
                p.id === id ? { ...p, name: newName } : p
            );
            write(updated);
        },
    };
});
