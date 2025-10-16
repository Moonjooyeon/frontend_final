import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useScSearch } from "../hooks/useScSearch";
import { useNowPlayingStore } from "../useNowPlayingStore";

export default function SearchPage() {
    const [sp] = useSearchParams();
    const q = sp.get("q") || "";
    const genre = sp.get("genre") || "all-music";
    const { items, loading, next, error, search, loadMore } = useScSearch();

    // ✅ 훅에서 필요한 액션만 뽑기 (이 이름이 실제 실행 함수)
    const playTrack = useNowPlayingStore((s) => s.playTrack);

    useEffect(() => {
        const qToSend = genre === "all-music" ? "" : q;
        window.scrollTo({ top: 0, behavior: "instant" });
        search({ q: qToSend, genre, limit: 12 });
    }, [q, genre, search]);

    const onClickItem = (it, idx) => {
        // 현재 목록을 큐로 넘기고 클릭한 아이템 재생
        playTrack(it, items);
    };

    return (
        <div style={{ padding: 16, paddingBottom: 96 }}>
            <h2>Search Results</h2>

            {loading && items.length === 0 && <div>Loading…</div>}
            {error && <div style={{ color: "tomato" }}>검색 중 오류가 발생했습니다.</div>}
            {!loading && items.length === 0 && !error && <div>결과가 없습니다.</div>}

            <ul
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 12,
                }}
            >
                {items.map((it, idx) => (
                    <li
                        key={it.id}
                        onClick={() => onClickItem(it, idx)} // ✅ idx 이제 정의됨
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
