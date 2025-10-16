// src/components/AddToPlaylistButton.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePlaylistStore } from "../playlistStore";
import { scToPlaylistItem } from "../lib/scToPlaylistItem";

const Icon = {
    plus: (p) => (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden {...p}>
            <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
        </svg>
    ),
    check: (p) => (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden {...p}>
            <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
        </svg>
    ),
    search: (p) => (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden {...p}>
            <path fill="currentColor" d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8L20 22l2-2-6.5-6.5zM10 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
        </svg>
    ),
};

export default function AddToPlaylistButton({ track, onAdded }) {
    const { playlists, addItem, addPlaylist } = usePlaylistStore();
    const [open, setOpen] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const [filter, setFilter] = useState("");
    const rootRef = useRef(null);
    const inputRef = useRef(null);

    // 외부 클릭으로 닫기
    useEffect(() => {
        const onDoc = (e) => {
            if (!rootRef.current || rootRef.current.contains(e.target)) return;
            setOpen(false);
        };
        if (open) document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 0);
        else setFilter("");
    }, [open]);

    const options = useMemo(() => {
        const arr = (playlists || []).map((p) => ({ id: p.id, name: p.name || "이름 없음" }));
        const f = filter.trim().toLowerCase();
        return f ? arr.filter((o) => o.name.toLowerCase().includes(f)) : arr;
    }, [playlists, filter]);

    const handleAdd = (playlistId) => {
        const item = scToPlaylistItem(track);
        addItem(playlistId, item);
        setOpen(false);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1200);
        onAdded?.(playlistId);
    };

    const handleCreateAndAdd = () => {
        const base = "내 플레이리스트";
        const n = (usePlaylistStore.getState().playlists || []).filter((p) => p.name?.startsWith(base)).length + 1;
        addPlaylist(`${base} ${n}`);
        const latest = usePlaylistStore.getState().playlists.at(-1);
        if (latest) handleAdd(latest.id);
    };

    // ── styles (다크 테마, 스샷 느낌)
    const s = {
        wrap: { position: "relative", display: "inline-block" },
        trigger: (hover) => ({
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(32,32,32,0.9)",
            color: justAdded ? "#22c55e" : hover ? "#93c5fd" : "#e5e7eb",
            cursor: "pointer",
            transition: "all .15s ease",
            boxShadow: "0 4px 14px rgba(0,0,0,.25)",
            backdropFilter: "blur(10px)",
        }),
        menu: {
            position: "absolute",
            right: 0,
            top: "110%",
            minWidth: 280,
            maxWidth: 320,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(18,18,18,0.92)",
            color: "#f3f4f6",
            boxShadow: "0 18px 40px rgba(0,0,0,.45)",
            backdropFilter: "blur(12px)",
            zIndex: 1000,
            overflow: "hidden",
        },
        row: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            fontSize: 14,
            color: "#e5e7eb",
            cursor: "pointer",
        },
        rowHover: { background: "rgba(255,255,255,.06)" },
        divider: { height: 1, background: "rgba(255,255,255,.08)", margin: "4px 0" },
        searchWrap: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 10,
            borderBottom: "1px solid rgba(255,255,255,.08)",
            background: "rgba(255,255,255,.04)",
        },
        searchInput: {
            flex: 1,
            height: 32,
            padding: "0 10px",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 8,
            outline: "none",
            background: "rgba(10,10,10,.6)",
            color: "#e5e7eb",
        },
        list: { maxHeight: 260, overflow: "auto", padding: "4px 0" },
        label: { fontSize: 13, opacity: 0.7 },
    };

    const [hoverBtn, setHoverBtn] = useState(false);
    const [hoverIndex, setHoverIndex] = useState(-1);

    return (
        <div ref={rootRef} style={s.wrap} onClick={(e) => e.stopPropagation()}>
            <button
                style={s.trigger(hoverBtn)}
                onMouseEnter={() => setHoverBtn(true)}
                onMouseLeave={() => setHoverBtn(false)}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                title="플레이리스트에 추가"
            >
                {justAdded ? Icon.check() : Icon.plus()}
                {justAdded ? "추가됨" : "플리에 추가"}
            </button>

            {open && (
                <div role="menu" style={s.menu}>
                    {/* 검색 */}
                    <div style={s.searchWrap}>
                        {Icon.search({ style: { opacity: 0.8 } })}
                        <input
                            ref={inputRef}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="플레이리스트 찾기"
                            aria-label="플레이리스트 찾기"
                            style={s.searchInput}
                        />
                    </div>

                    {/* 새 플레이리스트 */}
                    <div
                        style={{ ...s.row, fontWeight: 600 }}
                        onMouseEnter={() => setHoverIndex(-2)}
                        onMouseLeave={() => setHoverIndex(-1)}
                        onClick={handleCreateAndAdd}
                    >
                        {Icon.plus()}
                        새 플레이리스트
                    </div>

                    <div style={s.divider} />

                    {/* 플레이리스트 목록 */}
                    <div style={s.list}>
                        {options.length === 0 ? (
                            <div style={{ ...s.row, cursor: "default" }}>
                                <span style={s.label}>검색 결과가 없어요</span>
                            </div>
                        ) : (
                            options.map((opt, i) => (
                                <div
                                    key={opt.id}
                                    style={{ ...s.row, ...(hoverIndex === i ? s.rowHover : null) }}
                                    onMouseEnter={() => setHoverIndex(i)}
                                    onMouseLeave={() => setHoverIndex(-1)}
                                    onClick={() => handleAdd(opt.id)}
                                >
                                    {/* 동그란 점 아이콘 느낌 */}
                                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                                        <circle cx="4" cy="4" r="4" fill="rgba(255,255,255,.6)" />
                                    </svg>
                                    {opt.name}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
