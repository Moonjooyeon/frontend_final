// src/pages/Discover.jsx
import React, { useEffect } from "react";
import { useScSearch } from "../../hooks/useScSearch";
import { useNowPlayingStore } from "../../useNowPlayingStore";

export default function DiscoverPage() {
  const { items, loading, next, error, search, loadMore } = useScSearch();
  const playTrack = useNowPlayingStore((s) => s.playTrack);

  useEffect(() => {
    search({ q: "", genre: "all-music", limit: 16 });
  }, [search]);

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <h2>Discover (SoundCloud Top)</h2>
      {loading && items.length === 0 && <div>Loading…</div>}
      {error && (
        <div style={{ color: "tomato" }}>로드 중 오류가 발생했습니다.</div>
      )}

      <ul
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((it) => (
          <li
            key={it.id}
            onClick={() => playTrack(it, items)}
            style={{
              listStyle: "none",
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 10,
              cursor: "pointer",
              userSelect: "none",
            }}
            title="클릭하여 재생"
          >
            {it.artwork && (
              <img
                src={it.artwork}
                alt={it.title}
                style={{ width: "100%", borderRadius: 8 }}
              />
            )}
            <div style={{ marginTop: 8, fontWeight: 600 }}>{it.title}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{it.artist}</div>
          </li>
        ))}
      </ul>

      {next && (
        <button style={{ marginTop: 16 }} disabled={loading} onClick={loadMore}>
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
