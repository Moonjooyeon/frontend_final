// src/pages/PlaylistDetail.jsx  ★ PATCH
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

    // 최초 1회 더미 주입 (기존 로직 유지)
    const didInitRef = React.useRef(false);
    React.useEffect(() => {
        if (!pl || didInitRef.current) return;

        const hasItems = Array.isArray(pl.items) && pl.items.length > 0;
        const hasLegacyTracks = Array.isArray(pl.tracks) && pl.tracks.length > 0;

        if (!hasItems && !hasLegacyTracks) {
            setTracks(pid, DUMMY_TRACKS);
        }
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

    // ★★★★★ 핵심: 렌더는 items 전체 기준으로
    const items = Array.isArray(pl.items)
        ? pl.items
        : Array.isArray(pl.tracks)
            ? pl.tracks.map((t) => ({
                id: t.id,
                kind: "track",
                title: t.title,
                subtitle: t.artist ?? "",
            }))
            : [];

    // 콘솔에서 즉시 검증
    React.useEffect(() => {
        console.groupCollapsed("[PlaylistDetail] items snapshot");
        console.table(items.map(i => ({
            id: i.id, kind: i.kind ?? "(legacy)", title: i.title, subtitle: i.subtitle
        })));
        console.groupEnd();
    }, [items]);

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
            // ★ track/video 공통 삭제 API 사용
            removeItem(pid, itemId);
            setOpenMenuItemId(null);
        }
    };

    // kind 뱃지
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

    return (
        <div style={{ display: "grid", gap: 16 }}>
            {/* 상단 히어로 */}
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
                    <h1 style={{ margin: 0, fontSize: 48, fontWeight: 900 }}>{pl.name}</h1>
                    {/* ★ 곡 수 → 항목 수 (트랙+비디오) */}
                    <div style={{ opacity: 0.75, marginTop: 6 }}>항목: {items.length}개</div>
                </div>
            </section>

            {/* 아이템 테이블 (track + video 공통) */}
            <section>
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

                {items.map((it, i) => (
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
                        <div style={{ opacity: 0.7 }}>{i + 1}</div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <KindBadge kind={it.kind} />
                                <div style={{ fontWeight: 700 }}>{it.title}</div>
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                                {/* track은 artist/ subtitle, video는 channel/ subtitle */}
                                {it.subtitle ?? ""}
                            </div>
                        </div>
                        <div style={{ textAlign: "right", opacity: 0.8 }}>
                            {/* 길이 미정이면 대시 */}
                            {it.durationMs ? Math.round(it.durationMs / 1000) + "s" : "–"}
                        </div>

                        {/* ⋯ 버튼 */}
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
                                    fontFamily:
                                        'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji"',
                                    letterSpacing: 1,
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
                ))}
            </section>
        </div>
    );
}
