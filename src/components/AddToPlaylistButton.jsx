
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { usePlaylistStore } from "../playlistStore";
import { scToPlaylistItem as _scToPlaylistItem } from "../lib/scToPlaylistItem";

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
            <path
                fill="currentColor"
                d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8L20 22l2-2-6.5-6.5zM10 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
            />
        </svg>
    ),
};

export default function AddToPlaylistButton({
                                                track,
                                                onAdded,
                                                toItem = _scToPlaylistItem,    // ✅ 기본은 사클 변환기, 필요시 교체
                                                variant = "chip",              // "chip" | "bar"
                                            }) {
    const { playlists, addItem, addPlaylist } = usePlaylistStore();
    const [open, setOpen] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const [filter, setFilter] = useState("");

    const btnRef = useRef(null);
    const inputRef = useRef(null);
    const menuRef = useRef(null);

    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

    const recomputePos = () => {
        const b = btnRef.current?.getBoundingClientRect();
        if (!b) return;
        const minW = 280, maxW = 320, gutter = 8;
        const width = Math.min(maxW, Math.max(minW, b.width + 120));
        const left = Math.min(Math.max(gutter, b.left), window.innerWidth - width - gutter);
        const top = b.bottom + 8;
        setMenuPos({ top, left, width });
    };

    useEffect(() => {
        const onDoc = (e) => {
            if (!open) return;
            if (btnRef.current?.contains(e.target)) return;
            if (menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    useLayoutEffect(() => {
        if (!open) return;
        recomputePos();
        const onScroll = () => recomputePos();
        const onResize = () => recomputePos();
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize);
        setTimeout(() => inputRef.current?.focus(), 0);
        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize);
        };
    }, [open]);

    useEffect(() => {
        if (!open) setFilter("");
    }, [open]);

    const options = useMemo(() => {
        const arr = (playlists || []).map((p) => ({ id: p.id, name: p.name || "이름 없음" }));
        const f = filter.trim().toLowerCase();
        return f ? arr.filter((o) => o.name.toLowerCase().includes(f)) : arr;
    }, [playlists, filter]);

    const handleAdd = (playlistId) => {
        const item = toItem ? toItem(track) : track;     // ✅ 유튜브는 그대로
        addItem(playlistId, item);
        setOpen(false);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1200);
        onAdded?.(playlistId);
    };

    const handleCreateAndAdd = () => {
        const base = "내 플레이리스트";
        const before = usePlaylistStore.getState().playlists || [];
        const beforeIds = new Set(before.map(p => p.id));
        const name = `${base} ${before.filter(p => (p.name || "").startsWith(base)).length + 1}`;

        const maybeId = addPlaylist(name);
        if (maybeId) return handleAdd(maybeId);

        const findCreated = () => {
            const after = usePlaylistStore.getState().playlists || [];
            return after.find(p => !beforeIds.has(p.id) && p.name === name);
        };
        const created = findCreated();
        if (created) handleAdd(created.id);
        else setTimeout(() => {
            const late = findCreated();
            if (late) handleAdd(late.id);
            else alert("플레이리스트는 생성됐을 수 있어요. 목록에서 선택해 주세요.");
        }, 0);
    };

    // ── styles
    const s = {
        chipBtn: (hover, ok) => ({
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, padding: "6px 10px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)", background: "rgba(32,32,32,0.9)",
            color: ok ? "#22c55e" : hover ? "#93c5fd" : "#e5e7eb",
            cursor: "pointer", transition: "all .15s ease",
            boxShadow: "0 4px 14px rgba(0,0,0,.25)", backdropFilter: "blur(10px)",
            width: "auto",
        }),
        barBtn: (ok) => ({
            display: "block", width: "100%",
            textAlign: "center", fontSize: 13, fontWeight: 600,
            padding: "8px 10px", borderRadius: 8,
            background: "#f4f6f8", color: ok ? "#16a34a" : "#111",
            border: "1px solid #e5e7eb",
        }),
        menuFixed: {
            position: "fixed",
            top: menuPos.top, left: menuPos.left, width: menuPos.width,
            minWidth: 280, maxWidth: 320, borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(18,18,18,0.92)", color: "#f3f4f6",
            boxShadow: "0 18px 40px rgba(0,0,0,.45)", backdropFilter: "blur(12px)",
            zIndex: 10000, overflow: "hidden",
        },
        row: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", fontSize: 14, color: "#e5e7eb", cursor: "pointer" },
        rowHover: { background: "rgba(255,255,255,.06)" },
        divider: { height: 1, background: "rgba(255,255,255,.08)", margin: "4px 0" },
        searchWrap: { display: "flex", alignItems: "center", gap: 8, padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)" },
        searchInput: { flex: 1, height: 32, padding: "0 10px", border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, outline: "none", background: "rgba(10,10,10,.6)", color: "#e5e7eb" },
        list: { maxHeight: 260, overflow: "auto", padding: "4px 0" },
        label: { fontSize: 13, opacity: 0.7 },
    };

    const [hoverBtn, setHoverBtn] = useState(false);
    const [hoverIndex, setHoverIndex] = useState(-1);

    const MenuContent = (
        <div ref={menuRef} role="menu" style={s.menuFixed} onClick={(e) => e.stopPropagation()}>
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
                            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                                <circle cx="4" cy="4" r="4" fill="rgba(255,255,255,.6)" />
                            </svg>
                            {opt.name}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const btnStyle = variant === "bar" ? s.barBtn(justAdded) : s.chipBtn(hoverBtn, justAdded);

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <button
                ref={btnRef}
                style={btnStyle}
                onMouseEnter={() => setHoverBtn(true)}
                onMouseLeave={() => setHoverBtn(false)}
                onClick={() => setOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                title="플레이리스트에 추가"
            >
                {justAdded ? Icon.check() : Icon.plus()}
                {justAdded ? "추가됨" : "플리에 추가"}
            </button>
            {open && createPortal(MenuContent, document.body)}
        </div>
    );
}
