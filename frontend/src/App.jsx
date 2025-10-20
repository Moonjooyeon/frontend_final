// src/App.jsx
import React, { useState, lazy, Suspense } from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import "./App.css";

/* ─────────────────────────────────────────────
   페이지 import (초기 로드가 꼭 필요한 것만 eager)
────────────────────────────────────────────── */
import HomePage from "./pages/home/Home.jsx";
import PlaylistDetail from "./pages/PlaylistDetail.jsx";

// Lazy: 첫 화면에 불필요한 페이지들만 청크 분리
const DiscoverPage = lazy(() => import("./pages/discover/Discover.jsx"));
const BoardPage = lazy(() => import("./pages/board/Board.jsx"));
const LibraryPage = lazy(() => import("./pages/Library/Library.jsx"));
const SearchPage = lazy(() => import("./pages/Search.jsx"));

/* ─────────────────────────────────────────────
   전역 스토어 & 공용 컴포넌트
────────────────────────────────────────────── */
import { usePlaylistStore } from "./playlistStore"; // 팀원은 "../store/playlistStore"
import PlayerBar from "./components/PlayerBar";

/* --------------------------------------
   분리 컴포넌트: 사이드바 트랙/영상 탭
   (훅 규칙 위반 방지, 플레이리스트 전환 시 key로 초기화)
--------------------------------------- */
function SidebarTracks({ playlist }) {
  const [tab, setTab] = useState("all"); // 'tracks' | 'videos' | 'all'
  const { removeTrack, setTracks } = usePlaylistStore();

  // items 우선, 없으면 tracks를 items로 매핑
  const rawItems = playlist.items?.length
    ? playlist.items
    : playlist.tracks?.map((t) => ({ ...t, kind: "track" })) ?? [];

  const FALLBACK = [
    { id: 1, title: "Love wins all", artist: "아이유", kind: "track" },
    { id: 2, title: "네모의 꿈", artist: "아이유", kind: "track" },
    {
      id: 3,
      title: "에잇 (Prod.&Feat. SUGA)",
      artist: "아이유, SUGA",
      kind: "track",
    },
  ];

  const items = React.useMemo(
    () => (rawItems.length ? rawItems : FALLBACK),
    [rawItems.length, rawItems]
  );
  const videos = React.useMemo(
    () => items.filter((i) => i.kind === "video"),
    [items]
  );
  const tracks = React.useMemo(
    () => items.filter((i) => i.kind !== "video"),
    [items]
  );

  // store 메서드 안전 체크
  const store = usePlaylistStore.getState ? usePlaylistStore.getState() : null;
  const canRemoveItem = !!store?.removeItem;
  const canRemoveVideo = !!store?.removeVideo;

  const onDelete = (it) => {
    if (playlist.items?.length && store) {
      if (canRemoveItem) return store.removeItem(playlist.id, it.id);
      if (it.kind === "track" && typeof removeTrack === "function") {
        return removeTrack(playlist.id, it.id);
      }
      if (it.kind === "video" && canRemoveVideo) {
        return store.removeVideo(playlist.id, it.id);
      }
      return; // 삭제 미구현
    }
    // 예전 tracks 전용(또는 더미)
    if (!playlist.tracks?.length) {
      const seeded = FALLBACK.filter((x) => x.id !== it.id);
      setTracks(playlist.id, seeded);
    } else if (it.kind !== "video" && typeof removeTrack === "function") {
      removeTrack(playlist.id, it.id);
    }
  };

  const list = tab === "all" ? items : tab === "tracks" ? tracks : videos;

  return (
    <>
      <div className="tracks-head">
        <strong className="tracks-title">{playlist.name}</strong>
        <span className="tracks-count">
          총 {tracks.length + videos.length}개
        </span>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === "all" ? "is-active" : ""}`}
          onClick={() => setTab("all")}
        >
          전체 <span className="badge">{items.length}</span>
        </button>
        <button
          className={`tab ${tab === "tracks" ? "is-active" : ""}`}
          onClick={() => setTab("tracks")}
          style={{ marginLeft: 8 }}
        >
          트랙 <span className="badge">{tracks.length}</span>
        </button>
        <button
          className={`tab ${tab === "videos" ? "is-active" : ""}`}
          onClick={() => setTab("videos")}
          style={{ marginLeft: 8 }}
        >
          영상 <span className="badge">{videos.length}</span>
        </button>
      </div>

      {list.length > 0 ? (
        <ul className="track-list">
          {list.map((it) => (
            <li key={`${it.kind}-${it.id}`} className="track-item">
              <div className="ti-title">{it.title}</div>
              <div className="ti-artist">
                {it.kind === "video"
                  ? it.channel || it.subtitle || ""
                  : it.artist || it.subtitle || ""}
              </div>
              <button
                className="mini-del"
                onClick={() => onDelete(it)}
                style={{ marginLeft: "auto" }}
                disabled={
                  playlist.items?.length &&
                  !canRemoveItem &&
                  (it.kind === "video"
                    ? !canRemoveVideo
                    : typeof removeTrack !== "function")
                }
                title={
                  playlist.items?.length &&
                  !canRemoveItem &&
                  (it.kind === "video"
                    ? !canRemoveVideo
                    : typeof removeTrack !== "function")
                    ? "삭제 기능 미구현"
                    : "삭제"
                }
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-hint">
          {tab === "tracks" ? "트랙이 없습니다." : "영상이 없습니다."}
        </div>
      )}
    </>
  );
}

/* --------------------------------------
   PlaylistPanel (팀원 구현 유지, onSelect 지원)
--------------------------------------- */
function PlaylistPanel({ open, onClose, onSelect }) {
  const { playlists, addPlaylist, deletePlaylist, updatePlaylist } =
    usePlaylistStore();
  const [editingId, setEditingId] = React.useState(null);
  const [draftName, setDraftName] = React.useState("");

  const commitName = (p) => {
    const next = draftName.trim();
    if (next && next !== p.name) updatePlaylist(p.id, next);
    setEditingId(null);
  };

  if (!open) return null;

  const handleCreate = () => {
    const base = "내 플레이리스트";
    const n = playlists.filter((p) => p.name.startsWith(base)).length + 1;
    addPlaylist(`${base} ${n}`);
  };

  return (
    <div className="pl-panel">
      <div className="pl-panel-head">
        <strong>플레이리스트</strong>
        <button className="icon-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="pl-empty">
          <div className="title">아직 플레이리스트가 없어요</div>
          <div className="sub">
            “새 플레이리스트 만들기ˮ를 눌러 시작해 보세요.
          </div>
          <button className="card-cta" onClick={handleCreate}>
            새 플레이리스트 만들기
          </button>
        </div>
      ) : (
        <ul className="pl-list">
          {playlists.map((p) => (
            <li key={p.id} className="pl-item">
              <div className="pl-meta">
                {editingId === p.id ? (
                  <input
                    autoFocus
                    className="pl-edit"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => commitName(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitName(p);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <div
                    className="name"
                    onClick={() => onSelect?.(p.id)}
                    onDoubleClick={() => {
                      setDraftName(p.name);
                      setEditingId(p.id);
                    }}
                  >
                    {p.name}
                  </div>
                )}
                <div className="sub">{p.tracks?.length ?? 0}곡</div>
              </div>
              <button className="pl-del" onClick={() => deletePlaylist(p.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {playlists.length > 0 && (
        <div className="pl-panel-foot">
          <button className="card-cta" onClick={handleCreate}>
            새 플레이리스트 만들기
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------
   Layout (헤더/사이드바/푸터 + Outlet)
   ※ Suspense는 Outlet을 감싸야 함
--------------------------------------- */
function Layout() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  // Zustand
  const {
    playlists,
    deletePlaylist,
    addPlaylist,
    removeTrack,
    setTracks,
    updatePlaylist,
  } = usePlaylistStore();

  // 사이드바 상태
  const [sidebarMode, setSidebarMode] = useState("list"); // list | tracks
  const [selectedPlId, setSelectedPlId] = useState(null);
  const [plOpen, setPlOpen] = useState(false);

  // 인라인 이름수정
  const [editingListId, setEditingListId] = useState(null);
  const [listDraft, setListDraft] = useState("");

  const selectedPl = playlists.find((p) => p.id === selectedPlId) || null;

  // 헤더 검색
  const onHeaderSearchSubmit = (e) => {
    e.preventDefault();
    const next = q.trim();
    if (!next) return;
    navigate(`/search?q=${encodeURIComponent(next)}`);
  };

  // 사이드바 열고닫기
  const openTracks = (id) => {
    setSelectedPlId(id);
    setSidebarMode("tracks");
  };
  const backToList = () => {
    setSelectedPlId(null);
    setSidebarMode("list");
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div
          className="inner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{ cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/")}
          >
            Music App
          </div>

          {/* 검색창 */}
          <form
            onSubmit={onHeaderSearchSubmit}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색어 입력…"
              className="header-search-input"
              style={{ padding: "8px 12px", borderRadius: 12 }}
              onFocus={() => import("./pages/Search.jsx")} // 프리페치(선택)
            />
            <button
              type="submit"
              className="header-search-btn"
              style={{ padding: "8px 12px", borderRadius: 12 }}
            >
              Search
            </button>
          </form>
        </div>
      </header>

      {/* 사이드바 */}
      <aside className="sidebar">
        <div className="sidebar-head">
          {sidebarMode === "tracks" ? (
            <>
              <button
                className="back-btn"
                onClick={backToList}
                aria-label="back"
              >
                ←
              </button>
              <strong>{selectedPl?.name || "내 라이브러리"}</strong>
              <button
                className="icon-btn"
                onClick={() => {
                  const base = "내 플레이리스트";
                  const n =
                    playlists.filter((p) => p.name.startsWith(base)).length + 1;
                  addPlaylist(`${base} ${n}`);
                }}
              >
                +
              </button>
            </>
          ) : (
            <>
              <strong>내 라이브러리</strong>
              <button
                className="icon-btn"
                onClick={() => {
                  const base = "내 플레이리스트";
                  const n =
                    playlists.filter((p) => p.name.startsWith(base)).length + 1;
                  addPlaylist(`${base} ${n}`);
                }}
              >
                +
              </button>
            </>
          )}
        </div>

        {/* 첫 안내 카드 */}
        {playlists.length === 0 && (
          <div className="sidebar-card">
            <div className="card-title">첫 번째 플레이리스트를 만드세요.</div>
            <div className="card-sub">어렵지 않아요. 저희가 도와드릴게요.</div>
            <button
              className="card-cta"
              onClick={() => {
                const base = "내 플레이리스트";
                const n =
                  playlists.filter((p) => p.name.startsWith(base)).length + 1;
                addPlaylist(`${base} ${n}`);
                setSidebarMode("list");
              }}
            >
              플레이리스트 만들기
            </button>
          </div>
        )}

        {/* 리스트 모드 */}
        {sidebarMode === "list" && (
          <section className="sidebar-playlists">
            {playlists.length === 0 ? (
              <div className="empty-hint">플레이리스트를 만들어 보세요.</div>
            ) : (
              <ul className="pl-mini-list">
                {playlists.map((p) => (
                  <li
                    key={p.id}
                    className="pl-mini-item"
                    onClick={(e) => {
                      if (editingListId) return;
                      if (e.detail === 2) return;
                      openTracks(p.id);
                    }}
                  >
                    <div className="mini-left">
                      {editingListId === p.id ? (
                        <input
                          className="pl-edit"
                          autoFocus
                          value={listDraft}
                          onChange={(e) => setListDraft(e.target.value)}
                          onBlur={() => {
                            const v = listDraft.trim();
                            if (v && v !== p.name) updatePlaylist(p.id, v);
                            setEditingListId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = listDraft.trim();
                              if (v && v !== p.name) updatePlaylist(p.id, v);
                              setEditingListId(null);
                            }
                            if (e.key === "Escape") setEditingListId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="mini-name"
                          title="더블클릭: 이름 수정"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setListDraft(p.name);
                            setEditingListId(p.id);
                          }}
                        >
                          {p.name}
                        </div>
                      )}
                      <div className="mini-sub">
                        {(() => {
                          const items = Array.isArray(p.items)
                            ? p.items
                            : p.tracks ?? [];
                          const trackCount = items.filter(
                            (i) => i.kind !== "video"
                          ).length;
                          const videoCount = items.filter(
                            (i) => i.kind === "video"
                          ).length;

                          if (trackCount > 0 && videoCount > 0) {
                            return `${trackCount}곡 | ${videoCount}개`;
                          } else if (trackCount > 0) {
                            return `${trackCount}곡`;
                          } else if (videoCount > 0) {
                            return `${videoCount}개`;
                          } else {
                            return "0곡";
                          }
                        })()}
                      </div>
                    </div>
                    <div className="mini-actions">
                      <button
                        className="mini-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaylist(p.id);
                          if (selectedPlId === p.id) backToList();
                        }}
                      >
                        삭제
                      </button>
                      <button
                        className="mini-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListDraft(p.name);
                          setEditingListId(p.id);
                        }}
                      >
                        ✍🏻
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 트랙 모드 (탭: 트랙 / 영상) */}
        {sidebarMode === "tracks" && selectedPl && (
          <section className="sidebar-tracks">
            {/* key로 선택 변경 시 탭 초기화 */}
            <SidebarTracks key={selectedPl.id} playlist={selectedPl} />
          </section>
        )}
      </aside>

      {/* Playlist Panel (사이드바 밖) */}
      <PlaylistPanel
        open={plOpen}
        onClose={() => setPlOpen(false)}
        onSelect={(id) => {
          openTracks(id);
          setPlOpen(false);
        }}
      />

      {/* 본문 */}
      <main className="app-main">
        <nav className="app-nav" style={{ display: "flex", gap: 12 }}>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/discover">Discover</NavLink>
          <NavLink to="/board">게시판</NavLink>
          <NavLink to="/library">Library</NavLink>
        </nav>

        <section className="page">
          {/* ✅ 라우트 화면만 Suspense로 감싸기 */}
          <Suspense
            fallback={<div style={{ padding: 16, opacity: 0.6 }}>로딩 중…</div>}
          >
            <Outlet />
          </Suspense>
        </section>
      </main>

      {/* Footer (팀원 구조 유지: PlayerBar를 Footer에) */}
      <footer className="app-footer">
        <PlayerBar />
        <div className="inner">© 2025 Your Name</div>
      </footer>
    </div>
  );
}

/* --------------------------------------
   라우터 엔트리
--------------------------------------- */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="playlist/:id" element={<PlaylistDetail />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
