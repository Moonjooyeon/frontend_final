// src/components/TrackCard.jsx
import React from "react";

export default function TrackCard({ track }) {
    const img = track.artworkUrl || track.artwork_url || track.user?.avatarUrl || track.user?.avatar_url;
    const title = track.title || "Untitled";
    const artist = track.user?.username || track.username || "Unknown";
    const link = track.permalinkUrl || track.permalink_url;

    return (
        <a
            href={link}
            target="_blank"
            rel="noreferrer"
            style={{
                display: "block",
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                textDecoration: "none",
                color: "inherit",
            }}
        >
            <div
                style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#f6f6f6",
                }}
            >
                {img ? (
                    <img
                        src={img}
                        alt={title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        loading="lazy"
                    />
                ) : null}
            </div>
            <div style={{ marginTop: 8, fontWeight: 700, lineHeight: 1.3 }}>
                {title}
            </div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>{artist}</div>
        </a>
    );
}
