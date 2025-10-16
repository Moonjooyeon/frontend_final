// src/App.jsx
import React, { useState } from "react";
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
   👇 페이지 import (네 프로젝트 구조에 맞게 하나만 사용)
   OPTION A: 팀원 구조 (pages 하위 폴더 세분화)
────────────────────────────────────────────── */
import HomePage from "./pages/home/Home.jsx";
import DiscoverPage from "./pages/discover/Discover.jsx";
// import SearchPage from "../pages/search/Search";

 import BoardPage from "./pages/board/Board.jsx";
// import Trending from "../pages/trending/Trending"; // 네가 추가했다면
// import SaasPage from "../pages/saas/Saas";



import SearchPage from "./pages/Search.jsx";
import LibraryPage from "./pages/Library/Library.jsx";
import PlaylistDetail from "./pages/PlaylistDetail.jsx";
//import Trending from "./pages/Trending.jsx";
import SaasPage from "./pages/Saas.jsx";


/* ─────────────────────────────────────────────
   전역 스토어 & 공용 컴포넌트
────────────────────────────────────────────── */
import { usePlaylistStore } from "./playlistStore"; // 팀원은 "../store/playlistStore"
import PlayerBar from "./components/PlayerBar";

/* ─────────────────────────────────────────────
   더미 트랙 (빈 플레이리스트용 기본)
────────────────────────────────────────────── */
const DUMMY_TRACKS = [
    { id: 1, title: "Love wins all", artist: "아이유" }, // call → all로 교정
    { id: 2, title: "네모의 꿈", artist: "아이유" },
    { id: 3, title: "에잇 (Prod.&Feat. SUGA)", artist: "아이유, SUGA" },
];

/* --------------------------------------
    Layout (사이드바/패널은 팀원 UX 유지 + 네 라우트 추가)
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
                    <form onSubmit={onHeaderSearchSubmit} style={{ display: "flex", gap: 8 }}>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="검색어 입력…"
                            className="header-search-input"
                            style={{ padding: "8px 12px", borderRadius: 12 }}
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
                            <button className="back-btn" onClick={backToList} aria-label="back">
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
                                            <div className="mini-sub">{p.tracks?.length ?? 0}곡</div>
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

                {/* 트랙 모드 */}
                {sidebarMode === "tracks" && selectedPl && (
                    <section className="sidebar-tracks">
                        <div className="tracks-head">
                            <strong className="tracks-title">{selectedPl.name}</strong>
                            <span className="tracks-count">
                {selectedPl.tracks?.length ?? DUMMY_TRACKS.length}곡
              </span>
                        </div>
                        <ul className="track-list">
                            {(selectedPl.tracks?.length ? selectedPl.tracks : DUMMY_TRACKS).map(
                                (t) => (
                                    <li key={t.id} className="track-item">
                                        <div className="ti-title">{t.title}</div>
                                        <div className="ti-artist">{t.artist}</div>
                                        <button
                                            className="mini-del"
                                            onClick={() => {
                                                if (!selectedPl.tracks?.length) {
                                                    const seeded = DUMMY_TRACKS.filter((x) => x.id !== t.id);
                                                    setTracks(selectedPl.id, seeded);
                                                } else {
                                                    removeTrack(selectedPl.id, t.id);
                                                }
                                            }}
                                            style={{ marginLeft: "auto" }}
                                        >
                                            삭제
                                        </button>
                                    </li>
                                )
                            )}
                        </ul>
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
                    <NavLink to="/" end>Home</NavLink>
                    {/*<NavLink to="/trending">Trending</NavLink>*/}
                    <NavLink to="/discover">Discover</NavLink>
                    <NavLink to="/saas">Saas</NavLink>
                    <NavLink to="/board">게시판</NavLink>
                    <NavLink to="/library">Library</NavLink>
                </nav>

                <section className="page">
                    <Outlet />
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
                <button className="icon-btn" onClick={onClose}>✕</button>
            </div>

            {playlists.length === 0 ? (
                <div className="pl-empty">
                    <div className="title">아직 플레이리스트가 없어요</div>
                    <div className="sub">“새 플레이리스트 만들기ˮ를 눌러 시작해 보세요.</div>
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
    라우터
--------------------------------------- */
export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<HomePage />} />
                    {/* <Route path="trending" element={<Trending />} />*/}
                    <Route path="discover" element={<DiscoverPage />} />
                    <Route path="board" element={<BoardPage />} />      {/* 없으면 제거 */}
                    <Route path="search" element={<SearchPage />} />
                    <Route path="saas" element={<SaasPage />} />
                    <Route path="library" element={<LibraryPage />} />
                    <Route path="playlist/:id" element={<PlaylistDetail />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}
