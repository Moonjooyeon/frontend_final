// src/pages/Library.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { usePlaylistStore } from "../playlistStore";

export default function LibraryPage() {
    const { playlists } = usePlaylistStore();
    const nav = useNavigate();

    const open = (id) => nav(`/library?id=${id}`);

    // 커버 색상/이니셜 생성
    const coverFor = (name) => {
        const seed = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
        const h = seed % 360;
        const bg = `linear-gradient(135deg,hsl(${h} 60% 18%),hsl(${(h + 40) % 360} 60% 28%))`;
        const initials = name.trim() ? name.trim().slice(0, 2).toUpperCase() : "PL";
        return { bg, initials };
    };

    return (
        <div style={{ display: "grid", gap: 16 }}>
            {/* 상단 타이틀 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>내 플레이리스트</h2>
            </div>

            {/* 카드 그리드 / 빈 상태 */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 16,
                }}
            >
                {playlists.length === 0 ? (
                    // ✅ 빈 상태
                    <div
                        style={{
                            gridColumn: "1 / -1",
                            textAlign: "center",
                            padding: "80px 0",
                            opacity: 0.9,
                        }}
                    >
                        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                            아직 플레이리스트가 없어요
                        </div>
                        <div style={{ fontSize: 15, opacity: 0.75 }}>
                            사이드바의 <strong>+</strong> 버튼이나 “플레이리스트 만들기”로 시작해 보세요.
                        </div>
                    </div>
                ) : (
                    playlists.map((p) => {
                        const { bg, initials } = coverFor(p.name);
                        return (
                            <div
                                key={p.id}
                                onClick={() => open(p.id)}
                                style={{ cursor: "pointer", display: "grid", gap: 8 }}
                                title="열기"
                            >
                                {/* 커버 */}
                                <div style={{ position: "relative" }}>
                                    {/* 겹표지 느낌 */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: 8,
                                            top: -6,
                                            width: "25%",
                                            height: 10,
                                            borderRadius: 6,
                                            background: "rgba(255,255,255,0.08)",
                                            filter: "blur(0.2px)",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: 16,
                                            top: -2,
                                            width: "35%",
                                            height: 10,
                                            borderRadius: 6,
                                            background: "rgba(255,255,255,0.06)",
                                            filter: "blur(0.2px)",
                                        }}
                                    />

                                    <div
                                        style={{
                                            height: 140,
                                            borderRadius: 14,
                                            background: bg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 900,
                                            fontSize: 32,
                                            letterSpacing: 1,
                                            userSelect: "none",
                                            position: "relative",
                                        }}
                                    >
                                        {initials}

                                        {/* 더보기 버튼 */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert("… 메뉴 자리");
                                            }}
                                            aria-label="more actions"
                                            style={{
                                                position: "absolute",
                                                right: 8,
                                                top: 8,
                                                width: 28,
                                                height: 28,
                                                borderRadius: 999,
                                                border: "1px solid rgba(255,255,255,0.2)",
                                                background: "rgba(0,0,0,0.35)",
                                                color: "#fff",
                                                cursor: "pointer",
                                            }}
                                        >
                                            ⋯
                                        </button>

                                        {/* 우하단 뱃지 */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                right: 8,
                                                bottom: 8,
                                                padding: "4px 8px",
                                                borderRadius: 999,
                                                background: "rgba(0,0,0,0.55)",
                                                color: "#fff",
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            동영상 {p.tracks?.length ?? 0}개
                                        </div>
                                    </div>
                                </div>

                                {/* 메타 */}
                                <div style={{ display: "grid", gap: 2 }}>
                                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                                    <div style={{ opacity: 0.75, fontSize: 13 }}>비공개 · 재생목록</div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            open(p.id);
                                        }}
                                        style={{
                                            textAlign: "left",
                                            padding: 0,
                                            background: "none",
                                            border: "none",
                                            color: "rgba(255,255,255,0.9)",
                                            fontSize: 13,
                                            cursor: "pointer",
                                        }}
                                    >
                                        전체 재생목록 보기
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
