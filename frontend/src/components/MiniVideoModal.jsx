// src/components/MiniVideoModal.jsx
import React from "react";

export default function MiniVideoModal({ open, onClose, video }) {
    if (!open || !video) return null;

    // 유튜브 링크를 iframe으로 임베드
    const getEmbedUrl = (v) => {
        const id = v.youtubeId || v.externalId;
        const url = v.url;
        if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
        if (url && url.includes("youtube.com/watch")) {
            try {
                const u = new URL(url);
                const vid = u.searchParams.get("v");
                if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1`;
            } catch {}
        }
        return null;
    };

    const embed = getEmbedUrl(video);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: 480,
                    background: "#111",
                    color: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {video.title || "영상"}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "#fff",
                            fontSize: 18,
                            cursor: "pointer",
                        }}
                    >
                        ×
                    </button>
                </div>

                {embed ? (
                    <div style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}>
                        <iframe
                            title="mini-video"
                            src={embed}
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                border: 0,
                            }}
                        />
                    </div>
                ) : (
                    <div style={{ padding: 16 }}>
                        <p>유튜브 링크가 없어요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
