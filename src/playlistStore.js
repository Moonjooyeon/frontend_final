// playlistStore.js
import { create } from 'zustand';

const sanitizeItem = (raw = {}) => {
    const kind = (raw.kind === 'video' || raw.kind === 'track') ? raw.kind : 'track';
    return {
        id: raw.id || uid(),
        kind, // ✅ video/track 보존
        source: raw.source || (kind === 'video' ? 'youtube' : 'spotify'),
        externalId: raw.externalId || '',
        title: raw.title || '(Untitled)',
        subtitle: raw.subtitle || raw.artist || raw.channel || '',
        durationMs: raw.durationMs ?? undefined,
        thumbnail: raw.thumbnail || '',
        url: raw.url || '',
        addedAt: raw.addedAt || Date.now(),
    };
};


// ─────────────────────────────────────────────
// 얕은 비교 유틸
// ─────────────────────────────────────────────
const shallowSameItems = (a = [], b = []) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const ia = a[i], ib = b[i];
        if (!ia || !ib) return false;
        if ((ia.id || '') !== (ib.id || '')) return false;
        if ((ia.kind || 'track') !== (ib.kind || 'track')) return false;
        // ↓ 외부 연동형에서 같은 항목 판별에 externalId까지 고려 (영상/음원 중복 방지)
        if ((ia.externalId || '') !== (ib.externalId || '')) return false;
    }
    return true;
};

const shallowSamePlaylists = (prev = [], next = []) => {
    if (prev === next) return true;
    if (prev.length !== next.length) return false;
    for (let i = 0; i < prev.length; i++) {
        const pa = prev[i], pb = next[i];
        if (!pa || !pb) return false;
        if (pa.id !== pb.id) return false;
        if (pa.name !== pb.name) return false;
        const aItems = pa.items || [];
        const bItems = pb.items || [];
        if (aItems.length !== bItems.length) return false;
        if (!shallowSameItems(aItems, bItems)) return false;
    }
    return true;
};

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
const uid = () => (crypto.randomUUID?.() || String(Date.now() + Math.random()));

// 레거시 playlist({ tracks }) → 신규 playlist({ items })로 변환
const normalizePlaylist = (p) => {
    if (Array.isArray(p.items)) return p; // 이미 신규 구조
    const fromTracks = Array.isArray(p.tracks) ? p.tracks : [];
    const items = fromTracks.map((t) => ({
        id: t.id || uid(),
        kind: 'track', // 레거시는 트랙으로 간주
        source: t.source || 'spotify',
        externalId: t.externalId || '',
        title: t.title || '(Untitled)',
        subtitle: t.artist || t.subtitle || '',
        durationMs: t.durationMs,
        thumbnail: t.thumbnail || '',
        url: t.url || '',
        addedAt: t.addedAt || Date.now(),
    }));
    const { tracks, ...rest } = p;
    return { ...rest, items };
};

// 초기 로드 시 마이그레이션
const migrate = (raw) => {
    try {
        const arr = JSON.parse(raw || '[]');
        if (!Array.isArray(arr)) return [];
        return arr.map((p) => normalizePlaylist(p));
    } catch {
        return [];
    }
};

// items → tracks 레거시 미러
const buildLegacyTracks = (items = []) =>
    items
        .filter((it) => (it.kind ?? 'track') === 'track')
        .map((it) => ({
            id: it.id,
            title: it.title,
            artist: it.subtitle ?? '',
            durationMs: it.durationMs,
            thumbnail: it.thumbnail,
            url: it.url,
            source: it.source,
            externalId: it.externalId,
            addedAt: it.addedAt,
        }));

const withLegacyTracks = (playlists = []) =>
    playlists.map((p) => ({
        ...p,
        tracks: buildLegacyTracks(p.items || []),
    }));

// ─────────────────────────────────────────────
// 스토어
// ─────────────────────────────────────────────
export const usePlaylistStore = create((set, get) => {
    const read = () => {
        const raw = localStorage.getItem('playlists') || '[]';
        const migrated = migrate(raw);
        return withLegacyTracks(migrated); // 읽을 때 tracks 미러 주입
    };

    // 변경이 있을 때만 set + localStorage 반영
    const write = (updated) => {
        const prev = get().playlists;
        const withTracks = withLegacyTracks(updated); // 저장 전 미러 동기화
        if (shallowSamePlaylists(prev, withTracks)) return; // 동일하면 no-op
        localStorage.setItem('playlists', JSON.stringify(withTracks));
        set({ playlists: withTracks });
    };

    return {
        // STATE
        playlists: read(),

        // PLAYLIST CRUD
        addPlaylist: (name) => {
            const newList = {
                id: Date.now(),
                name,
                items: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            const updated = [...get().playlists, newList];
            write(updated);
        },

        deletePlaylist: (playlistId) => {
            const updated = get().playlists.filter((p) => p.id !== playlistId);
            write(updated);
        },

        updatePlaylist: (id, newName) => {
            const now = Date.now();
            const updated = get().playlists.map((p) =>
                p.id === id ? { ...p, name: newName, updatedAt: now } : p
            );
            write(updated);
        },

        // ITEM 공통 API (음악/영상 모두)
// addItem 교체
        addItem: (playlistId, item) => {
            const now = Date.now();
            const nextItem = sanitizeItem({ ...item, addedAt: now }); // ✅ 강제 정규화

            const updated = get().playlists.map((p) => {
                if (p.id !== playlistId) return p;

                const prev = p.items || [];
                // 같은 id 또는 같은(kind+externalId)면 중복으로 간주
                const dup = prev.some(it =>
                    it.id === nextItem.id ||
                    (it.kind === nextItem.kind && it.externalId && it.externalId === nextItem.externalId)
                );
                if (dup) return p;

                return { ...p, items: [...prev, nextItem], updatedAt: now };
            });
            write(updated);
        },

// setItems 교체
        setItems: (playlistId, items) => {
            const state = get();
            let changed = false;

            const sanitized = (items || []).map(sanitizeItem); // ✅ 모두 정규화

            const updated = state.playlists.map((p) => {
                if (p.id !== playlistId) return p;

                const prev = p.items || [];
                if (shallowSameItems(prev, sanitized)) return p;

                changed = true;
                return { ...p, items: sanitized, updatedAt: Date.now() };
            });

            if (changed) write(updated);
        },


        removeItem: (playlistId, itemId) => {
            const now = Date.now();
            let changed = false;
            const updated = get().playlists.map((p) => {
                if (p.id !== playlistId) return p;
                const prev = p.items || [];
                const next = prev.filter((it) => it.id !== itemId);
                if (next.length === prev.length) return p; // 제거 대상 없음 → no-op
                changed = true;
                return { ...p, items: next, updatedAt: now };
            });
            if (changed) write(updated);
        },

        // (레거시 호환) TRACK 전용 API → 내부적으로 items 사용
        addTrack: (playlistId, track /* {title, artist, ...} */) => {
            const item = {
                kind: 'track',
                source: track.source || 'spotify',
                externalId: track.externalId || '',
                title: track.title || '(Untitled)',
                subtitle: track.artist || track.subtitle || '',
                durationMs: track.durationMs,
                thumbnail: track.thumbnail || '',
                url: track.url || '',
            };
            get().addItem(playlistId, item);
        },

        setTracks: (playlistId, tracks) => {
            const toItems = (arr = []) =>
                arr.map((t) => ({
                    id: t.id || uid(),
                    kind: 'track',
                    source: t.source || 'spotify',
                    externalId: t.externalId || '',
                    title: t.title || '(Untitled)',
                    subtitle: t.artist || t.subtitle || '',
                    durationMs: t.durationMs,
                    thumbnail: t.thumbnail || '',
                    url: t.url || '',
                    addedAt: t.addedAt || Date.now(),
                }));

            const state = get();
            let changed = false;

            const updated = state.playlists.map((p) => {
                if (p.id !== playlistId) return p;

                const prev = Array.isArray(p.items) ? p.items : [];
                const incoming = toItems(tracks || []);

                // 1) 완전 비어있으면 → 그대로 채우기
                if (prev.length === 0) {
                    if (incoming.length === 0 || shallowSameItems(prev, incoming)) return p;
                    changed = true;
                    return { ...p, items: incoming, updatedAt: Date.now() };
                }

                // 2) 이미 아이템이 있으면 → 병합(중복 제거)
                const seen = new Set(prev.map((it) => it.id));
                const prevKey = (it) => (it.title || '') + '::' + (it.subtitle || '');
                const prevKeys = new Set(prev.map(prevKey));

                const toAppend = incoming.filter((it) => {
                    if (!it.id || seen.has(it.id)) return false;
                    const key = prevKey(it);
                    if (prevKeys.has(key)) return false; // title+subtitle 동일시 중복으로 간주
                    return true;
                });

                if (toAppend.length === 0) return p; // 변화 없음
                changed = true;
                return { ...p, items: [...prev, ...toAppend], updatedAt: Date.now() };
            });

            if (changed) {

                const target = updated.find(p => p.id === playlistId);
                if (target) get().setItems(playlistId, target.items);
            }
        },


        removeTrack: (playlistId, trackId) => {
            get().removeItem(playlistId, trackId);
        },

        // VIDEO 전용 API
        addVideo: (playlistId, video) => {
            const item = sanitizeItem({
                ...video,
                kind: 'video',
                source: video?.source || 'youtube',
                subtitle: video?.channel || video?.subtitle, // 채널명 → subtitle
            });
            get().addItem(playlistId, item);
        },
    };
});

if (typeof window !== 'undefined') {
    window.usePlaylistStore = usePlaylistStore;
}
