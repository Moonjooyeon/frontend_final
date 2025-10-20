import React from "react";
import { useNavigate } from "react-router-dom";
import { usePlaylistStore } from "../../playlistStore.js";

export default function LibraryPage() {
    const { playlists, deletePlaylist, updatePlaylist } = usePlaylistStore();
    const nav = useNavigate();

    const [activeMenuId, setActiveMenuId] = React.useState(null);
    const [editingId, setEditingId] = React.useState(null);
    const [editValue, setEditValue] = React.useState("");

    const open = (id) => nav(`/playlist/${id}`);

    const handleStartEdit = (id, currentName) => {
        setActiveMenuId(null);
        setEditingId(id);
        setEditValue(currentName || "");
    };

    const handleSave = (id) => {
        const v = editValue.trim();
        if (v) updatePlaylist(id, v);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (window.confirm("정말 삭제하시겠습니까?")) deletePlaylist(id);
        setActiveMenuId(null);
    };

    // 커버 색상/이니셜 생성
    const coverFor = (name) => {
        const seed = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
        const h = seed % 360;
        const bg = `linear-gradient(135deg,hsl(${h} 60% 18%),hsl(${(h + 40) % 360} 60% 28%))`;
        const initials = name.trim() ? name.trim().slice(0, 2).toUpperCase() : "PL";
        return { bg, initials };
    };

    // 컴포넌트 상단 (return 위에)
    React.useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setActiveMenuId(null);
                setEditingId(null);
            }
        };
        window.addEventListener("click", handleClickOutside);
        window.addEventListener("keydown", handleEsc);
        return () => {
            window.removeEventListener("click", handleClickOutside);
            window.removeEventListener("keydown", handleEsc);
        };
    }, []);


    return (
        <div style={{ display: "grid", gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>내 플레이리스트</h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 16,
                }}
            >
                {playlists.length === 0 ? (
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
                        const isEditing = editingId === p.id;

                        return (
                            <div key={p.id} style={{ position: "relative" }}>
                                <div
                                    onClick={() => {
                                        if (editingId) return; // 편집 중엔 상세로 이동 막기
                                        open(p.id);
                                    }}
                                    style={{
                                        cursor: isEditing ? "default" : "pointer",
                                        display: "grid",
                                        gap: 8,
                                        position: "relative",
                                    }}
                                >
                                    <div style={{ position: "relative" }}>
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

                                            {/* ⋯ 메뉴 버튼 */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === p.id ? null : p.id);
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

                                            {/* 팝업 메뉴 */}
                                            {activeMenuId === p.id && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        right: 8,
                                                        top: 40,
                                                        background: "rgba(20,20,20,0.95)",
                                                        border: "1px solid rgba(255,255,255,0.15)",
                                                        borderRadius: 8,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        zIndex: 9999,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <button
                                                        style={{
                                                            padding: "8px 12px",
                                                            background: "none",
                                                            border: "none",
                                                            color: "#fff",
                                                            cursor: "pointer",
                                                            textAlign: "left",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEdit(p.id, p.name);
                                                        }}
                                                    >
                                                        이름 수정
                                                    </button>
                                                    <button
                                                        style={{
                                                            padding: "8px 12px",
                                                            background: "none",
                                                            border: "none",
                                                            color: "tomato",
                                                            cursor: "pointer",
                                                            textAlign: "left",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm("정말 삭제하시겠습니까?")) {
                                                                deletePlaylist(p.id);
                                                            }
                                                            setActiveMenuId(null);
                                                        }}
                                                    >
                                                         삭제
                                                    </button>
                                                </div>
                                            )}

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
                                        {isEditing ? (
                                            <input
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => handleSave(p.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSave(p.id);
                                                    if (e.key === "Escape") setEditingId(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    padding: "6px 10px",
                                                    borderRadius: 6,
                                                    border: "1px solid rgba(255,255,255,0.2)",
                                                    background: "rgba(255,255,255,0.1)",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        ) : (
                                            <div style={{ fontWeight: 800 }}>{p.name}</div>
                                        )}
                                        <div style={{ opacity: 0.75, fontSize: 13 }}>재생목록</div>
                                        {!isEditing && (
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
