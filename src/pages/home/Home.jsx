// src/pages/home/Home.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import "./Home.css";

// ⬇️ 가로 무한 스크롤 훅 / 컴포넌트
import { useInfiniteRow } from "../../hooks/useInfiniteRow.jsx";
import TrackCard from "../../components/TrackCard";
import { useNowPlayingStore } from "../../useNowPlayingStore";
import { toUiTrack } from "../../lib/trackNormalize";

/* ─────────────────────────────────────────────
   0) cursor 정규화 + 단일 인코딩 fetchTrending (전역에 1개만!)
────────────────────────────────────────────── */
function normalizeCursorForQS(cursor) {
  if (!cursor) return cursor;
  let raw = cursor;
  for (let i = 0; i < 3; i++) {
    try {
      const dec = decodeURIComponent(raw);
      if (dec === raw) break;
      raw = dec;
    } catch { break; }
  }
  return raw;
}

async function fetchTrending(cursor) {
  const qs = cursor
      ? new URLSearchParams({ cursor: normalizeCursorForQS(cursor) }).toString()
      : new URLSearchParams({ genre: "all-music", limit: "20" }).toString();

  const url = `/api/charts/trending?${qs}`;
  const res = await fetch(url);

  if (!res.ok) {
    // search/tracks 커서에서 500 등 받으면 초기 파라미터로 1회 리셋
    if (cursor && res.status === 500) {
      const retry = await fetch(
          `/api/charts/trending?${new URLSearchParams({
            genre: "all-music",
            limit: "20",
          }).toString()}`
      );
      if (!retry.ok) {
        const t = await retry.text().catch(() => "");
        console.error("Trending RESET retry failed:", retry.status, t);
        throw new Error("HTTP " + retry.status);
      }
      return retry.json();
    }

    const t = await res.text().catch(() => "");
    console.error("Trending API error:", res.status, t);
    throw new Error("HTTP " + res.status);
  }

  return res.json();
}

// 안정적인 key 생성
const idOf = (raw) => {
  const x = raw?.track || raw;
  return (
      x?.id ??
      x?.permalink_url ??
      x?.uri ??
      (x?.title && x?.user?.username && `${x.title}@${x.user.username}`) ??
      null
  );
};

export default function Home() {
  // ───────── YouTube 인기 목록 상태 (페이지 전체를 막지 않도록 분리) ─────────
  const [videos, setVideos] = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState(null);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const loadPopularVideos = async () => {
      setYtLoading(true);
      setYtError(null);
      try {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (!apiKey) {
          throw new Error(
              "YouTube API Key가 없습니다. .env에 VITE_YOUTUBE_API_KEY를 설정한 뒤 서버를 재시작하세요."
          );
        }

        const res = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
          params: {
            key: apiKey,
            part: "snippet,statistics",
            chart: "mostPopular",
            regionCode: "KR",
            videoCategoryId: "10",
            maxResults: 10,
          },
        });

        setVideos(res.data?.items ?? []);
      } catch (err) {
        setYtError(err instanceof Error ? err : new Error("데이터 로딩 중 오류"));
      } finally {
        setYtLoading(false);
      }
    };

    loadPopularVideos();
  }, []);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });

  return (
      <div className="home-container">
        {/* ───────────────── YouTube 인기 캐러셀 ──────────────── */}
        <h2 className="home-title">실시간 인기 음악</h2>

        <div className="video-carousel">
          <button className="scroll-btn left" onClick={scrollLeft}>◀</button>
          <button className="scroll-btn right" onClick={scrollRight}>▶</button>

          <div ref={scrollRef} className="video-list">
            {ytLoading && <div style={{ color: "#aaa", padding: 16 }}>불러오는 중…</div>}
            {ytError && <div style={{ color: "tomato", padding: 16 }}>YouTube 오류: {ytError.message}</div>}
            {!ytLoading && !ytError && videos.map((video) => (
                <div
                    key={video.id}
                    onClick={() => setSelectedVideoId(video.id)}
                    className="video-card"
                >
                  <img
                      src={video.snippet?.thumbnails?.medium?.url}
                      alt={video.snippet?.title || "thumbnail"}
                      className="video-thumb"
                  />
                  <div className="video-info">
                    <h3 className="video-title">{video.snippet?.title}</h3>
                    <p className="video-channel">{video.snippet?.channelTitle}</p>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {selectedVideoId && (
            <div className="modal-overlay" onClick={() => setSelectedVideoId(null)}>
              <iframe
                  width="80%"
                  height="450"
                  src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-modal"
              />
            </div>
        )}

        {/* ───────────────── 아래에 Trending (가로 무한 스크롤) ──────────────── */}
        <TrendingRow />
      </div>
  );
}

/* =========================================================
   Home 아래에 붙는 가로 Trending 레일
========================================================= */
function TrendingRow() {
  const { items, loading, error, retry, rowRef, tailRef } = useInfiniteRow((c) => fetchTrending(c || null));
  const playTrack = useNowPlayingStore((s) => s.playTrack);
  const [scrollEl, setScrollEl] = useState(null);

  const tracks = useMemo(() => items.map((x) => x.track || x), [items]);
  const queue  = useMemo(() => tracks.map(toUiTrack).filter(Boolean), [tracks]);

  const onPlayIndex = (idx) => {
    const t = queue[idx];
    if (t) playTrack(t, queue);
  };

  // ✅ 좌우 스크롤 제어
  const scrollLeft = () => {
    if (scrollEl) scrollEl.scrollBy({ left: -300, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (scrollEl) scrollEl.scrollBy({ left: 300, behavior: "smooth" });
  };

  // rowRef.current를 상태로 잡아놓기 (버튼에서 사용 가능하게)
  useEffect(() => {
    if (rowRef.current) setScrollEl(rowRef.current);
  }, [rowRef]);

  return (
      <section className="trendingX-section">
        <div className="trendingX-head">
          <h2 className="trendingX-title">Trending</h2>
          <span className="trendingX-sub">지금 뜨는 트랙</span>
        </div>

        {error && (
            <div className="trendingX-error">
              트렌딩 로딩 실패: {String(error.message)}
              <button onClick={retry}>다시 시도</button>
            </div>
        )}

        {/* 좌우 스크롤 버튼 */}
        <div className="trendingX-carousel">
          <button className="scroll-btn left" onClick={scrollLeft}>◀</button>
          <button className="scroll-btn right" onClick={scrollRight}>▶</button>

          <div className="trendingX-row" ref={rowRef}>
            <ul className="trendingX-list">
              {tracks.map((t, idx) => {
                const k = idOf(t) ?? `fallback-${idx}`;
                return (
                    <li
                        key={k}
                        className="trendingX-item"
                        onClick={() => onPlayIndex(idx)}
                        title="클릭하여 재생"
                    >
                      <TrackCard track={t} />
                    </li>
                );
              })}
              <li ref={tailRef} className="trendingX-tail" aria-hidden />
            </ul>
          </div>
        </div>

        <div className="trendingX-loader">
          {loading ? "불러오는 중…" : "오른쪽으로 스크롤하거나 버튼을 눌러 더 보기"}
        </div>
      </section>
  );
}

