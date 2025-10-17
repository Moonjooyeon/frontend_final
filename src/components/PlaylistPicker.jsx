// src/components/PlaylistPicker.jsx
import React from "react";
import { usePlaylistStore } from "../playlistStore";

export default function PlaylistPicker({ open, onClose, onPick }) {
    const playlists = usePlaylistStore((s) => s.playlists);
    const addPlaylist = usePlaylistStore((s) => s.addPlaylist);

    const [draft, setDraft] = React.useState("");

    if (!open) return null;

    const handleCreate = () => {
        const name = draft.trim() || "내 플레이리스트";
        const id = addPlaylist(name);
        setDraft("");
        onPick?.(id);
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 420, maxWidth: "90vw", background: "#151515", color: "#fff",
                    border: "1px solid #2a2a2a", borderRadius: 12, padding: 14, boxShadow: "0 10px 30px rgba(0,0,0,.4)"
                }}
            >
                <div style={{ fontWeight: 800, marginBottom: 10 }}>플레이리스트에 추가</div>

                <div style={{ maxHeight: 260, overflow: "auto", borderRadius: 8, border: "1px solid #222" }}>
                    {playlists.length === 0 ? (
                        <div style={{ padding: 12, opacity: .8 }}>아직 플레이리스트가 없어요.</div>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {playlists.map((p) => (
                                <li key={p.id}>
                                    <button
                                        onClick={() => onPick?.(p.id)}
                                        style={{
                                            width: "100%", textAlign: "left",
                                            padding: "10px 12px", background: "transparent",
                                            border: "none", color: "#fff", cursor: "pointer"
                                        }}
                                    >
                                        {p.name} <span style={{ opacity:.6, fontSize:12, marginLeft:6 }}>
                      {p.items?.length ?? p.tracks?.length ?? 0}개
                    </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="새 플레이리스트 이름"
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#0d0d0d", color: "#fff" }}
                    />
                    <button onClick={handleCreate} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #333", background: "#1e1e1e", color: "#fff" }}>
                        새로 만들기
                    </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <button onClick={onClose} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #333", background: "#1e1e1e", color: "#fff" }}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
