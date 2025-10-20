// src/pages/Trending.jsx
import React, { useMemo } from "react";
import { useInfinitePage } from "../hooks/useInfinitePage.jsx";
import TrackCard from "../components/TrackCard";
import { useNowPlayingStore } from "../useNowPlayingStore";
import { toUiTrack } from "../lib/trackNormalize";

async function fetchTrending(cursor) {
  const params = new URLSearchParams({
    genre: "all-music",
    limit: "20",
  });

  if (cursor) params.set("cursor", cursor); // 값 있을 때만 추가

  const res = await fetch(`/api/charts/trending?${params.toString()}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}



export default function Trending() {
    const { items, loading, loaderRef } = useInfinitePage(fetchTrending);

    const playTrack = useNowPlayingStore((s) => s.playTrack);

    const tracks = useMemo(() => items.map((x) => x.track || x), [items]);

    // 재생 큐(정규화)
    const queue = useMemo(() => tracks.map(toUiTrack).filter(Boolean), [tracks]);

    const onPlayIndex = (idx) => {
        const t = queue[idx];
        if (!t) return;
        playTrack(t, queue);      // ← 하단 재생바 열리고 자동재생(우리가 PlayerBar에 위젯 API 붙였음)
    };
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
                {tracks.map((t, idx) => (
                    <li
                        key={t.id}
                        onClick={() => onPlayIndex(idx)}
                        style={{ cursor: "pointer" }}
                        title="클릭하여 재생"
                    >
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
