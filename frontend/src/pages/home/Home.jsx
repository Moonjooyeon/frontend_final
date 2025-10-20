// src/pages/home/Home.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import "./Home.css";

import { useInfiniteRow } from "../../hooks/useInfiniteRow.jsx";
import TrackCard from "../../components/TrackCard";
import { useNowPlayingStore } from "../../useNowPlayingStore";
import { toUiTrack } from "../../lib/trackNormalize";
import AddToPlaylistButton from "../../components/AddToPlaylistButton.jsx";

/* ─────────────────────────────────────────────
   cursor 정규화 + fetchTrending
────────────────────────────────────────────── */
function normalizeCursorForQS(cursor) {
  if (!cursor) return cursor;
  let raw = cursor;
  for (let i = 0; i < 3; i++) {
    try {
      const dec = decodeURIComponent(raw);
      if (dec === raw) break;
      raw = dec;
    } catch {
      break;
    }
  }
  return raw;
}
function normalizeSC(resp) {
  const rows = resp?.collection ?? resp?.result ?? resp?.items ?? [];
  const items = rows.map((r) => r?.track ?? r);       // charts/search 모두 커버
  const next  = resp?.next_href ?? resp?.next ?? resp?.cursor ?? null;
  return { items, next };
}

async function fetchTrending(cursor) {
  const qs = new URLSearchParams({ genre: "all-music", limit: "20" });
  if (cursor && cursor !== "undefined" && cursor !== "null") {
    qs.set("cursor", cursor); // 그대로 전달 (URLSearchParams가 필요한 인코딩 처리)
  }
  const res = await fetch(`/api/charts/trending?${qs.toString()}`);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("Trending API error:", res.status, t);
    throw new Error("HTTP " + res.status);
  }
  const data = await res.json();
  const { items, next } = normalizeSC(data);

  // ⬇️ 여러 훅 케이스를 모두 만족시키기 위해 넉넉히 반환
  return {
    items,               // useInfiniteRow가 items를 바라보는 경우
    collection: items,   // collection을 기대하는 경우
    next,                // next를 기대하는 경우
    cursor: next,            // cursor를 기대하는 경우
    raw: data,           // 디버깅용
  };
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

/* ─────────────────────────────────────────────
   Home 컴포넌트
────────────────────────────────────────────── */
export default function Home() {
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

        const res = await axios.get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
              params: {
                key: apiKey,
                part: "snippet,statistics",
                chart: "mostPopular",
                regionCode: "KR",
                videoCategoryId: "10",
                maxResults: 10,
              },
            }
        );

        setVideos(res.data?.items ?? []);
      } catch (err) {
        setYtError(err instanceof Error ? err : new Error("데이터 로딩 중 오류"));
      } finally {
        setYtLoading(false);
      }
    };

    loadPopularVideos();
  }, []);

  const scrollLeft = () =>
      scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  const scrollRight = () =>
      scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });

  return (
      <div className="home-container">
        {/* ───────────────── YouTube 인기 캐러셀 ──────────────── */}
        <h2 className="home-title">실시간 인기 음악</h2>

        <div className="video-carousel">
          <button className="scroll-btn left" onClick={scrollLeft}>
            ◀
          </button>
          <button className="scroll-btn right" onClick={scrollRight}>
            ▶
          </button>

          <div ref={scrollRef} className="video-list">
            {ytLoading && (
                <div style={{ color: "#aaa", padding: 16 }}>불러오는 중…</div>
            )}
            {ytError && (
                <div style={{ color: "tomato", padding: 16 }}>
                  YouTube 오류: {ytError.message}
                </div>
            )}
            {!ytLoading &&
                !ytError &&
                videos.map((video) => {
                  // ▶︎ AddToPlaylistButton이 그대로 받게 준비된 아이템
                  const ytItem = {
                    id: video.id,
                    kind: "video",
                    source: "youtube",
                    externalId: video.id,
                    title: video.snippet?.title,
                    subtitle: video.snippet?.channelTitle,
                    channel: video.snippet?.channelTitle,
                    thumbnail: video.snippet?.thumbnails?.medium?.url,
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                  };

                  return (
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

                        {/* ▶︎ 하단 바 스타일 드롭다운 버튼 */}
                        <div style={{ padding: 10 }}>
                          <AddToPlaylistButton
                              track={ytItem}
                              toItem={(x) => x}     // 이미 완성된 아이템이므로 그대로
                              variant="bar"         // 카드 하단 바 스타일
                          />
                        </div>
                      </div>
                  );
                })}
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
  const { items, loading, error, retry, rowRef, tailRef } = useInfiniteRow((c) =>
      fetchTrending(c || null)
  );
  const playTrack = useNowPlayingStore((s) => s.playTrack);
  const [scrollEl, setScrollEl] = useState(null);

  const tracks = useMemo(() => items, [items]);
  const queue = useMemo(() => tracks.map(toUiTrack).filter(Boolean), [tracks]);

  const onPlayIndex = (idx) => {
    const t = queue[idx];
    if (t) playTrack(t, queue);
  };

  const scrollLeft = () => {
    if (scrollEl) scrollEl.scrollBy({ left: -300, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (scrollEl) scrollEl.scrollBy({ left: 300, behavior: "smooth" });
  };

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

        <div className="trendingX-carousel">
          <button className="scroll-btn left" onClick={scrollLeft}>
            ◀
          </button>
          <button className="scroll-btn right" onClick={scrollRight}>
            ▶
          </button>

          <div className="trendingX-row"
               ref={(el) => { rowRef.current = el; setScrollEl(el); }}
          >
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
          {loading
              ? "불러오는 중…"
              : "오른쪽으로 스크롤하거나 버튼을 눌러 더 보기"}
        </div>
      </section>
  );
}
