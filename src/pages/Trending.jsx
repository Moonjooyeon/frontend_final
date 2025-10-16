// src/pages/Trending.jsx
import React, { useMemo } from "react";
import { useInfinitePage } from "../hooks/useInfinitePage";
import TrackCard from "../components/TrackCard";

async function fetchTrending(cursor) {
    const params = cursor
        ? `cursor=${encodeURIComponent(cursor)}`
        : `genre=all-music&limit=20`;
    const res = await fetch(`/api/charts/trending?${params}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
}


export default function Trending() {
    const { items, loading, loaderRef } = useInfinitePage(fetchTrending);

    // charts는 { track } 랩핑 → 평탄화
    const tracks = useMemo(
        () => items.map((x) => x.track || x),
        [items]
    );

    return (
        <div style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 12 }}>Trending</h2>
            <ul
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 12,
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                }}
            >
                {tracks.map((t) => (
                    <li key={t.id}>
                        <TrackCard track={t} />
                    </li>
                ))}
            </ul>

            <div ref={loaderRef} style={{ padding: 24, textAlign: "center" }}>
                {loading ? "불러오는 중…" : "더 보기 스크롤 ↓"}
            </div>
        </div>
    );
}
