// playlistStore.js
import { create } from 'zustand';

/* ─────────────────────────────────────────────
   유틸
────────────────────────────────────────────── */
const uid = () =>
    (crypto.randomUUID?.() || String(Date.now() + Math.random())) + ''; // ✅ 항상 string

// 브라우저 여부 체크
const isBrowser =
    typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// 안전한 로컬스토리지 read/write
const lsGet = (key, fallback = '[]') =>
    isBrowser ? localStorage.getItem(key) ?? fallback : fallback;
const lsSet = (key, value) => {
    if (isBrowser) localStorage.setItem(key, value);
};

/* ─────────────────────────────────────────────
   정규화
────────────────────────────────────────────── */
const sanitizeItem = (raw = {}) => {
    const kind =
        raw.kind === 'video' || raw.kind === 'track' ? raw.kind : 'track';
    return {
        id: String(raw.id || uid()),                 // ✅ id 문자열화
        kind, // video/track
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

// 레거시 playlist({ tracks }) → 신규 playlist({ items })
const normalizePlaylist = (p) => {
    if (!p) return { id: uid(), name: '(Untitled)', items: [] };
    const baseId = String(p.id ?? uid());          // ✅ id 문자열화

    if (Array.isArray(p.items)) {
        // items 안의 id도 문자열 보정
        const items = p.items.map((it) => sanitizeItem(it));
        return { ...p, id: baseId, items };
    }

    // 레거시 tracks → items
    const fromTracks = Array.isArray(p.tracks) ? p.tracks : [];
    const items = fromTracks.map((t) =>
        sanitizeItem({
            ...t,
            kind: 'track',
            source: t.source || 'spotify',
            subtitle: t.artist || t.subtitle || '',
        })
    );
    const { tracks, ...rest } = p || {};
    return { ...rest, id: baseId, items };
};

const migrate = (raw) => {
    try {
        const arr = JSON.parse(raw || '[]');
        if (!Array.isArray(arr)) return [];
        return arr.map((p) => normalizePlaylist(p));
    } catch {
        return [];
    }
};

// items → tracks (레거시 미러)
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

/* ─────────────────────────────────────────────
   얕은 비교(변경 감지)
────────────────────────────────────────────── */
const shallowSameItems = (a = [], b = []) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const ia = a[i],
            ib = b[i];
        if (!ia || !ib) return false;
        if (String(ia.id || '') !== String(ib.id || '')) return false; // ✅ 문자열 비교
        if ((ia.kind || 'track') !== (ib.kind || 'track')) return false;
        if ((ia.externalId || '') !== (ib.externalId || '')) return false;
        if ((ia.title || '') !== (ib.title || '')) return false;
        if ((ia.subtitle || '') !== (ib.subtitle || '')) return false;
    }
    return true;
};

const shallowSamePlaylists = (prev = [], next = []) => {
    if (prev === next) return true;
    if (prev.length !== next.length) return false;
    for (let i = 0; i < prev.length; i++) {
        const pa = prev[i],
            pb = next[i];
        if (!pa || !pb) return false;
        if (String(pa.id) !== String(pb.id)) return false; // ✅ 문자열 비교
        if (pa.name !== pb.name) return false;
        if ((pa.updatedAt || 0) !== (pb.updatedAt || 0)) return false;
        const aItems = pa.items || [];
        const bItems = pb.items || [];
        if (aItems.length !== bItems.length) return false;
        if (!shallowSameItems(aItems, bItems)) return false;
    }
    return true;
};

/* ─────────────────────────────────────────────
   스토어
────────────────────────────────────────────── */
export const usePlaylistStore = create((set, get) => {
    const read = () => {
        const raw = lsGet('playlists', '[]');
        const migrated = migrate(raw);
        return withLegacyTracks(migrated);
    };

    // 변경이 있을 때만 set + localStorage 반영
    const write = (updated) => {
        const prev = get().playlists;
        const withTracks = withLegacyTracks(updated);
        if (shallowSamePlaylists(prev, withTracks)) return; // 동일하면 no-op
        lsSet('playlists', JSON.stringify(withTracks));
        set({ playlists: withTracks });
    };

    // 내부 공통: dedupe 규칙
    const isDup = (existing = [], nextItem) => {
        const norm = (s = '') => s.trim().toLowerCase();
        const keyOf = (it) => `${norm(it.title)}::${norm(it.subtitle)}`;

        return existing.some((it) => {
            if (it.id && nextItem.id && String(it.id) === String(nextItem.id))
                return true;
            if (
                it.kind === nextItem.kind &&
                it.externalId &&
                nextItem.externalId &&
                it.externalId === nextItem.externalId
            )
                return true;
            return keyOf(it) === keyOf(nextItem);
        });
    };

    return {
        // STATE
        playlists: read(),

        // PLAYLIST CRUD
        addPlaylist: (name) => {
            const now = Date.now();
            const id = uid();                     // ✅ 미리 id 생성
            const newList = {
                id,                                  // ✅ 문자열 id
                name,
                items: [],
                createdAt: now,
                updatedAt: now,
            };
            const updated = [...get().playlists, newList];
            write(updated);
            return id;                             // ✅ 새 id 반환
        },

        deletePlaylist: (playlistId) => {
            const pid = String(playlistId);       // ✅ 문자열 비교
            const updated = get().playlists.filter((p) => String(p.id) !== pid);
            write(updated);
        },

        updatePlaylist: (id, newName) => {
            const pid = String(id);               // ✅ 문자열 비교
            const now = Date.now();
            const updated = get().playlists.map((p) =>
                String(p.id) === pid ? { ...p, name: newName, updatedAt: now } : p
            );
            write(updated);
        },

        // ITEM 공통 API (음악/영상 모두)
        addItem: (playlistId, item) => {
            const pid = String(playlistId);       // ✅ 문자열 비교
            const now = Date.now();
            const nextItem = sanitizeItem({ ...item, addedAt: now });

            const updated = get().playlists.map((p) => {
                if (String(p.id) !== pid) return p;

                const prev = Array.isArray(p.items) ? p.items : [];
                if (isDup(prev, nextItem)) return p;

                return { ...p, items: [...prev, nextItem], updatedAt: now };
            });
            write(updated);
        },

        setItems: (playlistId, items) => {
            const pid = String(playlistId);       // ✅ 문자열 비교
            const state = get();
            let changed = false;

            const sanitized = (items || []).map(sanitizeItem);

            const updated = state.playlists.map((p) => {
                if (String(p.id) !== pid) return p;

                const prev = Array.isArray(p.items) ? p.items : [];
                if (shallowSameItems(prev, sanitized)) return p;

                changed = true;
                return { ...p, items: sanitized, updatedAt: Date.now() };
            });

            if (changed) write(updated);
        },

        removeItem: (playlistId, itemId) => {
            const pid = String(playlistId);       // ✅ 문자열 비교
            const now = Date.now();
            let changed = false;
            const updated = get().playlists.map((p) => {
                if (String(p.id) !== pid) return p;
                const prev = Array.isArray(p.items) ? p.items : [];
                const next = prev.filter((it) => String(it.id) !== String(itemId));
                if (next.length === prev.length) return p;
                changed = true;
                return { ...p, items: next, updatedAt: now };
            });
            if (changed) write(updated);
        },

        // (레거시 호환) TRACK 전용 API → 내부적으로 items 사용
        addTrack: (playlistId, track /* {title, artist, ...} */) => {
            const item = {
                kind: 'track',
                source: track?.source || 'spotify',
                externalId: track?.externalId || '',
                title: track?.title || '(Untitled)',
                subtitle: track?.artist || track?.subtitle || '',
                durationMs: track?.durationMs,
                thumbnail: track?.thumbnail || '',
                url: track?.url || '',
            };
            get().addItem(String(playlistId), item); // ✅ 문자열 비교 일관화
        },

        setTracks: (playlistId, tracks) => {
            const pid = String(playlistId);       // ✅ 문자열 비교
            const state = get();
            let changed = false;

            const toItems = (arr = []) =>
                arr.map((t) =>
                    sanitizeItem({
                        ...t,
                        kind: 'track',
                        source: t.source || 'spotify',
                        subtitle: t.artist || t.subtitle || '',
                    })
                );

            const updated = state.playlists.map((p) => {
                if (String(p.id) !== pid) return p;

                const prev = Array.isArray(p.items) ? p.items : [];
                const incoming = toItems(tracks || []);

                if (prev.length === 0) {
                    if (incoming.length === 0 || shallowSameItems(prev, incoming)) return p;
                    changed = true;
                    return { ...p, items: incoming, updatedAt: Date.now() };
                }

                const prevKeys = new Set(
                    prev.map((it) => (String(it.id) || '') + '::' + (it.externalId || ''))
                );
                const norm = (s = '') => s.trim().toLowerCase();

                const toAppend = incoming.filter((it) => {
                    const key = (String(it.id) || '') + '::' + (it.externalId || '');
                    if (prevKeys.has(key)) return false;
                    const hasTitleSubDup = prev.some(
                        (pit) =>
                            norm(pit.title) === norm(it.title) &&
                            norm(pit.subtitle) === norm(it.subtitle)
                    );
                    return !hasTitleSubDup;
                });

                if (toAppend.length === 0) return p;
                changed = true;
                return { ...p, items: [...prev, ...toAppend], updatedAt: Date.now() };
            });

            if (changed) write(updated);
        },

        removeTrack: (playlistId, trackId) => {
            get().removeItem(String(playlistId), trackId); // ✅ 문자열 비교 일관화
        },

        // VIDEO 전용 API
        addVideo: (playlistId, video) => {
            const item = sanitizeItem({
                ...video,
                kind: 'video',
                source: video?.source || 'youtube',
                subtitle: video?.channel || video?.subtitle,
            });
            get().addItem(String(playlistId), item); // ✅ 문자열 비교 일관화
        },
    };
});

// 디버깅 편의
if (typeof window !== 'undefined') {
    window.usePlaylistStore = usePlaylistStore;
}
