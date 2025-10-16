// src/pages/PlaylistDetail.jsx  ★ 분리/필터 UI 추가 버전
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePlaylistStore } from "../playlistStore";

const DUMMY_TRACKS = [
    { id: 1, title: "Love wins all", artist: "아이유" },
    { id: 2, title: "네모의 꿈", artist: "아이유" },
    { id: 3, title: "에잇 (Prod.&Feat. SUGA)", artist: "아이유, SUGA" },
];

export default function PlaylistDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { playlists, removeItem, setTracks } = usePlaylistStore();

    const pid = Number(id);
    const pl = playlists.find((p) => p.id === pid);

    // 최초 더미 주입(그대로)
    const didInitRef = React.useRef(false);
    React.useEffect(() => {
        if (!pl || didInitRef.current) return;
        const hasItems = Array.isArray(pl.items) && pl.items.length > 0;
        const hasLegacyTracks = Array.isArray(pl.tracks) && pl.tracks.length > 0;
        if (!hasItems && !hasLegacyTracks) setTracks(pid, DUMMY_TRACKS);
        didInitRef.current = true;
    }, [pl, pid, setTracks]);

    if (!pl) {
        return (
            <div style={{ padding: 12 }}>
                <h2>플레이리스트를 찾을 수 없어요</h2>
                <button onClick={() => nav("/library")}>내 플레이리스트로 돌아가기</button>
            </div>
        );
    }

    // 렌더 기준: items 전체
    const items = Array.isArray(pl.items)
        ? pl.items
        : Array.isArray(pl.tracks)
            ? pl.tracks.map((t) => ({ id: t.id, kind: "track", title: t.title, subtitle: t.artist ?? "" }))
            : [];

    // 구분 배열 + 집계
    const tracks = React.useMemo(() => items.filter(i => (i.kind ?? "track") === "track"), [items]);
    const videos = React.useMemo(() => items.filter(i => i.kind === "video"), [items]);
    const counts = { all: items.length, track: tracks.length, video: videos.length };

    // 필터 (All/Tracks/Videos)
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
                fontSize: 11, padding: "2px 6px", borderRadius: 999,
                border: "1px solid rgba(255,255,255,.22)", opacity: 0.85, marginRight: 8,
            }}
            title={kind === "video" ? "Video" : "Track"}
        >
      {kind === "video" ? "🎬 video" : "♪ track"}
    </span>
    );

    // 공통 헤더 행
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

    // 공통 행 컴포넌트
    const Row = ({ it, index }) => (
        <div
            key={it.id}
            style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "40px 1fr 120px 40px",
                padding: "10px 8px",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,.06)",
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
                        e.stopPropagation();
                        setOpenMenuItemId((cur) => (cur === it.id ? null : it.id));
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                        width: 28, height: 28, borderRadius: 6, background: "transparent",
                        border: "1px solid rgba(255,255,255,.12)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, lineHeight: 1, color: "#fff",
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
                        position: "absolute", right: 8, top: 44, minWidth: 160,
                        background: "rgba(40, 40, 40, 0.98)", color: "#fff",
                        border: "1px solid rgba(255,255,255,.15)", borderRadius: 10,
                        padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,.3)", zIndex: 9999,
                    }}
                >
                    <button
                        style={{
                            width: "100%", textAlign: "left", padding: "10px 12px",
                            borderRadius: 8, border: "none", background: "transparent",
                            cursor: "pointer", color: "#fff", fontSize: 14,
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

    return (
        <div style={{ display: "grid", gap: 16 }}>
            {/* 상단 히어로 */}
            <section
                style={{
                    display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, alignItems: "center",
                    padding: "12px 0 8px", borderBottom: "1px solid rgba(255,255,255,.08)",
                }}
            >
                <div
                    style={{
                        width: 160, height: 160, borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02))",
                    }}
                />
                <div>
                    <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 6 }}>공개 플레이리스트</div>
                    <h1 style={{ margin: 0, fontSize: 48, fontWeight: 900 }}>{pl.name}</h1>
                    <div style={{ opacity: 0.75, marginTop: 6 }}>
                        항목: {counts.all}개 (🎬 {counts.video} / ♪ {counts.track})
                    </div>

                    {/* 필터 토글 */}
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                        {[
                            { key: "all", label: `전체 ${counts.all}` },
                            { key: "video", label: `영상 ${counts.video}` },
                            { key: "track", label: `트랙 ${counts.track}` },
                        ].map(btn => (
                            <button
                                key={btn.key}
                                onClick={() => setFilter(btn.key)}
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    border: "1px solid rgba(255,255,255,.18)",
                                    background: filter === btn.key ? "rgba(255,255,255,.12)" : "transparent",
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

            {/* 섹션별 테이블 */}
            {filteredSections.map(({ title, data }) => (
                <section key={title} style={{ marginTop: 6 }}>
                    <div
                        style={{
                            position: "sticky", top: 70, background: "rgba(0,0,0,.85)",
                            backdropFilter: "blur(6px)", zIndex: 1, padding: "6px 8px",
                            borderBottom: "1px solid rgba(255,255,255,.08)",
                            fontWeight: 800, letterSpacing: .2, opacity: .9,
                        }}
                    >
                        {title}
                    </div>
                    <TableHeader />
                    {data.length === 0 ? (
                        <div style={{ padding: "14px 8px", opacity: 0.6 }}>비어 있어요</div>
                    ) : (
                        data.map((it, idx) => <Row key={it.id} it={it} index={idx} />)
                    )}
                </section>
            ))}
        </div>
    );
}
