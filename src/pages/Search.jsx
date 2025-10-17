// src/pages/Search.jsx
import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

// 기존 의존성
import { useScSearch } from "../hooks/useScSearch";
import { useNowPlayingStore } from "../useNowPlayingStore";
import { toUiTrack } from "../lib/trackNormalize";

// ▶ 추가: 담기 버튼 (플리 피커 내장)
import AddToPlaylistButton from "../components/AddToPlaylistButton";

// ▶ (선택) 유튜브 결과를 store item으로 정규화
const ytToPlaylistItem = (v = {}) => {
    const id = v.id?.videoId || v.id;
    const sn = v.snippet || {};
    return {
        kind: "video",
        source: "youtube",
        externalId: String(id ?? ""),
        title: sn.title || "(Untitled)",
        subtitle: sn.channelTitle || "",
        durationMs: undefined, // 필요시 별도 API로 보강
        thumbnail: sn.thumbnails?.medium?.url || "",
        url: id ? `https://www.youtube.com/watch?v=${id}` : "",
    };
};

// 간단 스타일
const sectionStyle = { padding: 16, paddingBottom: 96 };
const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
    listStyle: "none",
    padding: 0,
    margin: 0,
};
const tabBtn = (active) => ({
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #444",
    background: active ? "#222" : "transparent",
    color: "#fff",
    cursor: "pointer",
});

export default function SearchPage() {
    const [sp, setSp] = useSearchParams();

    // 공통 파라미터
    const q = (sp.get("q") || "").trim();
    const source = (sp.get("source") || "sc").toLowerCase(); // youtube | sc
    const genre = sp.get("genre") || "all-music"; // sc 전용

    // 탭 전환
    const switchSource = (next) => {
        const nextSp = new URLSearchParams(sp);
        nextSp.set("source", next);
        setSp(nextSp, { replace: true });
        window.scrollTo({ top: 0, behavior: "auto" });
    };

    return (
        <div style={sectionStyle}>
            <h2 style={{ color: "#fff", marginBottom: 12 }}>Search Results</h2>

            {/* 탭 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button style={tabBtn(source === "sc")} onClick={() => switchSource("sc")}>
                    SoundCloud
                </button>
                <button style={tabBtn(source === "youtube")} onClick={() => switchSource("youtube")}>
                    YouTube
                </button>
            </div>

            {source === "youtube" ? (
                <YouTubeResult q={q} />
            ) : (
                <SoundCloudResult q={q} genre={genre} />
            )}
        </div>
    );
}

/* =========================================================
   SoundCloud 결과 (+ 플리 담기 버튼)
========================================================= */
function SoundCloudResult({ q, genre }) {
    const { items, loading, next, error, search, loadMore } = useScSearch();
    const playTrack = useNowPlayingStore((s) => s.playTrack);

    useEffect(() => {
        const qToSend = q || (genre === "all-music" ? "" : q);
        window.scrollTo({ top: 0, behavior: "auto" });
        search({ q: qToSend, genre, limit: 12 });
    }, [q, genre, search]);

    const queue = useMemo(() => items.map(toUiTrack).filter(Boolean), [items]);

    return (
        <>
            {loading && items.length === 0 && <div>Loading…</div>}
            {error && <div style={{ color: "tomato" }}>검색 중 오류가 발생했습니다.</div>}
            {!loading && items.length === 0 && !error && <div>결과가 없습니다.</div>}

            <ul style={gridStyle}>
                {items.map((it, idx) => (
                    <li
                        key={it.id ?? String(idx)}
                        onClick={() => {
                            const t = queue[idx];
                            if (t) playTrack(t, queue);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                const t = queue[idx];
                                if (t) playTrack(t, queue);
                            }
                        }}
                        tabIndex={0}
                        style={{
                            position: "relative",
                            border: "1px solid #eee",
                            borderRadius: 10,
                            padding: 10,
                            cursor: "pointer",
                            userSelect: "none",
                            outline: "none",
                        }}
                        title="클릭하여 재생"
                    >
                        {it.artwork && (
                            <img
                                src={it.artwork}
                                alt={it.title}
                                loading="lazy"
                                draggable={false}
                                style={{ width: "100%", borderRadius: 8, display: "block" }}
                            />
                        )}
                        <div style={{ marginTop: 8, fontWeight: 600 }}>{it.title}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{it.artist}</div>

                        {/* ▶ 담기 버튼: 클릭 전파 막기 (재생 방지) */}
                        <div style={{ position: "absolute", right: 10, top: 10 }}>
                            <div
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <AddToPlaylistButton
                                    // AddToPlaylistButton 내부에서 scToPlaylistItem(track) 사용
                                    track={{
                                        id: it.id,
                                        title: it.title,
                                        user: { username: it.artist, avatar_url: it.artwork },
                                        duration: it.durationMs,
                                        permalink: it.permalink || it.url, // toUiTrack 결과에 따라
                                        artwork_url: it.artwork,
                                        source: "soundcloud",
                                    }}
                                    variant="chip"
                                    onAdded={() => {/* 토스트 등 필요 시 */}}
                                />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {next && (
                <button style={{ marginTop: 16 }} disabled={loading} onClick={loadMore}>
                    {loading ? "Loading…" : "Load more"}
                </button>
            )}
        </>
    );
}

/* =========================================================
   YouTube 결과 (무한 스크롤 + iframe 모달 + 플리 담기)
========================================================= */
function YouTubeResult({ q }) {
    const [videos, setVideos] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const detachRef = useRef(() => {});

    const fetchVideos = useCallback(
        async (pageToken = "") => {
            if (!q) return;
            setLoading(true);
            try {
                const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
                if (!apiKey) throw new Error("YouTube API Key가 없습니다. .env에 VITE_YOUTUBE_API_KEY를 설정하세요.");

                const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
                    params: {
                        key: apiKey,
                        part: "snippet",
                        q,
                        type: "video",
                        maxResults: 12,
                        pageToken,
                        order: "viewCount",
                    },
                });

                setVideos((prev) => [...prev, ...(res.data?.items ?? [])]);
                setNextPageToken(res.data?.nextPageToken ?? null);
            } catch (err) {
                const apiMsg =
                    err?.response?.data?.error?.message ||
                    err?.response?.data?.error?.errors?.[0]?.reason ||
                    err?.message ||
                    "알 수 없는 오류";
                setError(new Error(apiMsg));
            } finally {
                setLoading(false);
            }
        },
        [q]
    );

    // q가 바뀌면 초기화 후 재검색
    useEffect(() => {
        setVideos([]);
        setNextPageToken(null);
        setError(null);
        window.scrollTo({ top: 0, behavior: "auto" });
        if (q) fetchVideos();
    }, [q, fetchVideos]);

    // 무한 스크롤
    useEffect(() => {
        const onScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - 120 && !loading && nextPageToken) {
                fetchVideos(nextPageToken);
            }
        };
        window.addEventListener("scroll", onScroll);
        detachRef.current = () => window.removeEventListener("scroll", onScroll);
        return () => detachRef.current();
    }, [loading, nextPageToken, fetchVideos]);

    if (error) return <div style={{ color: "tomato" }}>Error: {error.message}</div>;

    return (
        <>
            {videos.length === 0 && !loading && <div style={{ color: "#fff" }}>검색 결과가 없습니다.</div>}

            <div style={gridStyle}>
                {videos.map((v) => {
                    const id = v.id?.videoId;
                    const sn = v.snippet || {};
                    return (
                        <div
                            key={id}
                            onClick={() => setSelectedVideoId(id)}
                            style={{
                                position: "relative",
                                border: "1px solid #eee",
                                borderRadius: 10,
                                padding: 10,
                                cursor: "pointer",
                                userSelect: "none",
                                outline: "none",
                            }}
                            title="클릭하여 재생"
                        >
                            <img
                                src={sn?.thumbnails?.medium?.url}
                                alt={sn?.title || "thumbnail"}
                                loading="lazy"
                                style={{ width: "100%", borderRadius: 8, display: "block" }}
                            />
                            <div style={{ marginTop: 8, fontWeight: 600 }}>{sn?.title}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{sn?.channelTitle}</div>
                            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                                {sn?.description?.slice(0, 120)}
                            </div>

                            {/* ▶ 담기 버튼: 클릭 전파 막기 (모달 방지) */}
                            <div style={{ position: "absolute", right: 10, top: 10 }}>
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <AddToPlaylistButton
                                        // YouTube는 커스텀 변환기로 items 스키마 맞춤
                                        track={v}
                                        toItem={ytToPlaylistItem}
                                        variant="chip"
                                        onAdded={() => {/* 토스트 등 필요 시 */}}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && <div style={{ marginTop: 12 }}>로딩 중...</div>}

            {selectedVideoId && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedVideoId(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                    }}
                >
                    <iframe
                        width="80%"
                        height="450"
                        src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ borderRadius: 12 }}
                    />
                </div>
            )}
        </>
    );
}
