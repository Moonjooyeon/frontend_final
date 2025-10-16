import React from "react";
import AddToPlaylistButton from "./AddToPlaylistButton.jsx";

export default function TrackCard({ track, onPlay }) {
    const img =
        track.artwork ||
        track.artworkUrl ||
        track.artwork_url ||
        track.user?.avatarUrl ||
        track.user?.avatar_url ||
        null;

    const title = track.title || "Untitled";
    const artist = track.user?.username || track.username || "Unknown";
    const link = track.permalink || track.permalinkUrl || track.permalink_url || null;

    const onKey = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPlay?.();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onPlay?.()}
            onKeyDown={onKey}
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                cursor: "pointer",
                userSelect: "none",
                outline: "none",
            }}
            title="클릭하여 재생"
        >
            <div
                style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#f6f6f6",
                }}
            >
                {img && (
                    <img
                        src={img}
                        alt={title}
                        loading="lazy"
                        draggable={false}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                )}
            </div>

            <div style={{ marginTop: 8, fontWeight: 700, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {title}
            </div>
            <div style={{ opacity: 0.7, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {artist}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {link && (
                    <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} // 🔑 재생 클릭과 분리
                        style={{ fontSize: 12, color: "#69f", textDecoration: "none" }}
                        title="SoundCloud에서 열기"
                    >
                        Open ↗
                    </a>
                )}
                <span onClick={(e) => e.stopPropagation()}>
          <AddToPlaylistButton
              track={track}
              onAdded={() => {
                  // (선택) 토스트/피드백 넣고 싶으면 여기서
                  // e.g., console.log('추가됨');
              }}
          />
        </span>
            </div>
        </div>
    );
}
