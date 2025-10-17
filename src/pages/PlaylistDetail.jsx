// src/pages/PlaylistDetail.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePlaylistStore } from "../playlistStore";
import { useNowPlayingStore } from "../useNowPlayingStore";
import MiniVideoModal from "../components/MiniVideoModal";

const DUMMY_TRACKS = [
    { id: "1", title: "Love wins all", artist: "아이유" },
    { id: "2", title: "네모의 꿈", artist: "아이유" },
    { id: "3", title: "에잇 (Prod.&Feat. SUGA)", artist: "아이유, SUGA" },
];

export default function PlaylistDetail() {
    const { id } = useParams();
    const nav = useNavigate();

    // ✅ 재생 스토어 (자동 재생바)
    const playTrack = useNowPlayingStore((s) => s.playTrack);
    const setPlaying = useNowPlayingStore((s) => s.setPlaying);

    // ✅ 유튜브 미니모달
    const [videoOpen, setVideoOpen] = React.useState(false);
    const [videoItem, setVideoItem] = React.useState(null);

    // ✅ 플레이리스트 스토어
    const playlists = usePlaylistStore((s) => s.playlists);
    const removeItem = usePlaylistStore((s) => s.removeItem);
    const setTracks = usePlaylistStore((s) => s.setTracks);

    // ✅ URL 파라미터 문자열화
    const pid = React.useMemo(() => String(decodeURIComponent(id || "")), [id]);

    // ✅ 대상 플레이리스트
    const pl = playlists.find((p) => String(p.id) === pid);
    const notFound = !pl;

    // 최초 더미 주입 (비어있을 때만)
    const didInitRef = React.useRef(false);
    React.useEffect(() => {
        if (!pl || didInitRef.current) return;
        const hasItems = Array.isArray(pl.items) && pl.items.length > 0;
        const hasLegacyTracks = Array.isArray(pl.tracks) && pl.tracks.length > 0;
        if (!hasItems && !hasLegacyTracks) setTracks(pid, DUMMY_TRACKS);
        didInitRef.current = true;
    }, [pl, pid, setTracks]);

    // 렌더 기준 데이터: items -> tracks/videos
    const items = React.useMemo(() => {
        if (!pl) return [];
        if (Array.isArray(pl.items)) return pl.items;
        if (Array.isArray(pl.tracks)) {
            return pl.tracks.map((t) => ({
                id: String(t.id),
                kind: "track",
                title: t.title,
                subtitle: t.artist ?? "",
            }));
        }
        return [];
    }, [pl]);

    const tracks = React.useMemo(
        () => items.filter((i) => (i.kind ?? "track") === "track"),
        [items]
    );
    const videos = React.useMemo(
        () => items.filter((i) => i.kind === "video"),
        [items]
    );
    const counts = React.useMemo(
        () => ({ all: items.length, track: tracks.length, video: videos.length }),
        [items.length, tracks.length, videos.length]
    );

    // ✅ 클릭 시 동작: 영상=모달, 트랙=재생바 자동재생
    const onClickItem = React.useCallback(
        (it) => {
            if (it.kind === "video") {
                setVideoItem(it);
                setVideoOpen(true);
                return;
            }
            // 트랙 자동 재생: 사운드클라우드는 url에 soundcloud.com 포함 시 source 지정
            const normalized = {
                ...it,
                kind: "track",
                source:
                    it.source ||
                    (it.url?.includes?.("soundcloud.com") ? "soundcloud" : it.source),
            };
            // 큐는 트랙만 전달 (원치 않으면 [] 로)
            playTrack(normalized, tracks);
            setPlaying(true);
        },
        [playTrack, setPlaying, tracks]
    );

    const [filter, setFilter] = React.useState("all"); // 'all' | 'track' | 'video'
    const filteredSections = React.useMemo(() => {
        if (filter === "track") return [{ title: `트랙 (${counts.track})`, data: tracks }];
        if (filter === "video") return [{ title: `영상 (${counts.video})`, data: videos }];
        return [
            { title: `영상 (${counts.video})`, data: videos },
            { title: `트랙 (${counts.track})`, data: tracks },
        ];
    }, [filter, tracks, videos, counts.track, counts.video]);

    const [openMenuItemId, setOpenMenuItemId] = React.useState(null);
    const menuRef = React.useRef(null);
    React.useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setOpenMenuItemId(null);
        const onDown = (e) => {
            if (openMenuItemId && menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuItemId(null);
            }
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("mousedown", onDown);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("mousedown", onDown);
        };
    }, [openMenuItemId]);

    const handleDelete = (itemId) => {
        if (window.confirm("이 항목을 플레이리스트에서 삭제할까요?")) {
            removeItem(pid, itemId);
            setOpenMenuItemId(null);
        }
    };

    const KindBadge = ({ kind }) => (
        <span
            style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.22)",
                opacity: 0.85,
                marginRight: 8,
            }}
            title={kind === "video" ? "Video" : "Track"}
        >
      {kind === "video" ? "🎬 video" : "♪ track"}
    </span>
    );

    const TableHeader = () => (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 120px 40px",
                padding: "8px 8px",
                opacity: 0.7,
                borderBottom: "1px solid rgba(255,255,255,.08)",
                fontSize: 14,
            }}
        >
            <div>#</div>
            <div>제목</div>
            <div style={{ textAlign: "right" }}>길이</div>
        </div>
    );

    const Row = ({ it, index, onRowClick }) => (
        <div
            key={it.id}
            onClick={() => onRowClick?.(it)}
            title={it.kind === "video" ? "영상(작은 창 열기)" : "트랙(자동 재생바)"}
            style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "40px 1fr 120px 40px",
                padding: "10px 8px",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,.06)",
                cursor: "pointer",
            }}
        >
            <div style={{ opacity: 0.7 }}>{index + 1}</div>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <KindBadge kind={it.kind} />
                    <div style={{ fontWeight: 700 }}>{it.title}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{it.subtitle ?? ""}</div>
            </div>
            <div style={{ textAlign: "right", opacity: 0.8 }}>
                {it.durationMs ? Math.round(it.durationMs / 1000) + "s" : "–"}
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={openMenuItemId === it.id}
                    onClick={(e) => {
                        e.stopPropagation(); // 클릭 재생과 분리
                        setOpenMenuItemId((cur) => (cur === it.id ? null : it.id));
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,.12)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        lineHeight: 1,
                        color: "#fff",
                    }}
                    title="더보기"
                >
                    ⋯
                </button>
            </div>

            {openMenuItemId === it.id && (
                <div
                    ref={menuRef}
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        right: 8,
                        top: 44,
                        minWidth: 160,
                        background: "rgba(40, 40, 40, 0.98)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,.15)",
                        borderRadius: 10,
                        padding: 6,
                        boxShadow: "0 8px 24px rgba(0,0,0,.3)",
                        zIndex: 9999,
                    }}
                >
                    <button
                        style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#fff",
                            fontSize: 14,
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleDelete(it.id)}
                    >
                        삭제
                    </button>
                </div>
            )}
        </div>
    );

    // ⬇️ 렌더: early return 없이 분기
    return (
        <div style={{ display: "grid", gap: 16 }}>
            {notFound ? (
                <div style={{ padding: 12, color: "#fff" }}>
                    <h2>플레이리스트를 찾을 수 없어요</h2>
                    <button onClick={() => nav("/library")}>내 플레이리스트로 돌아가기</button>
                </div>
            ) : (
                <>
                    <section
                        style={{
                            display: "grid",
                            gridTemplateColumns: "160px 1fr",
                            gap: 16,
                            alignItems: "center",
                            padding: "12px 0 8px",
                            borderBottom: "1px solid rgba(255,255,255,.08)",
                        }}
                    >
                        <div
                            style={{
                                width: 160,
                                height: 160,
                                borderRadius: 12,
                                background:
                                    "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02))",
                            }}
                        />
                        <div>
                            <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 6 }}>
                                공개 플레이리스트
                            </div>
                            <h1 style={{ margin: 0, fontSize: 48, fontWeight: 900 }}>
                                {pl.name}
                            </h1>
                            <div style={{ opacity: 0.75, marginTop: 6 }}>
                                항목: {counts.all}개 (🎬 {counts.video} / ♪ {counts.track})
                            </div>

                            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                {[
                                    { key: "all", label: `전체 ${counts.all}` },
                                    { key: "video", label: `영상 ${counts.video}` },
                                    { key: "track", label: `트랙 ${counts.track}` },
                                ].map((btn) => (
                                    <button
                                        key={btn.key}
                                        onClick={() => setFilter(btn.key)}
                                        style={{
                                            padding: "6px 10px",
                                            borderRadius: 999,
                                            border: "1px solid rgba(255,255,255,.18)",
                                            background:
                                                filter === btn.key ? "rgba(255,255,255,.12)" : "transparent",
                                            color: "#fff",
                                            cursor: "pointer",
                                            fontSize: 13,
                                        }}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {filteredSections.map(({ title, data }) => (
                        <section key={title} style={{ marginTop: 6 }}>
                            <div
                                style={{
                                    position: "sticky",
                                    top: 70,
                                    background: "rgba(0,0,0,.85)",
                                    backdropFilter: "blur(6px)",
                                    zIndex: 1,
                                    padding: "6px 8px",
                                    borderBottom: "1px solid rgba(255,255,255,.08)",
                                    fontWeight: 800,
                                    letterSpacing: 0.2,
                                    opacity: 0.9,
                                }}
                            >
                                {title}
                            </div>
                            <TableHeader />
                            {data.length === 0 ? (
                                <div style={{ padding: "14px 8px", opacity: 0.6 }}>비어 있어요</div>
                            ) : (
                                data.map((it, idx) => (
                                    <Row key={it.id} it={it} index={idx} onRowClick={onClickItem} />
                                ))
                            )}
                        </section>
                    ))}

                    {/* 유튜브 미니모달 */}
                    <MiniVideoModal
                        open={videoOpen}
                        onClose={() => setVideoOpen(false)}
                        video={videoItem}
                    />
                </>
            )}
        </div>
    );
}
