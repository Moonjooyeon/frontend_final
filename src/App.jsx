// src/App.js
import React, { useState } from "react";
import {
    HashRouter,
    Routes,
    Route,
    NavLink,
    Outlet,
    useNavigate,
    useLocation,
} from "react-router-dom";
import { usePlaylistStore } from "./playlistStore";

// ✅ import들은 모두 최상단에
import HomePage from "./pages/Home.jsx";
import DiscoverPage from "./pages/Discover.jsx";
import SaasPage from "./pages/Saas.jsx";
import LibraryPage from "./pages/Library.jsx";
import SearchPage from "./pages/Search.jsx";

const DUMMY_TRACKS = [
    { id: 1, title: "Love wins all", artist: "아이유" },
    { id: 2, title: "네모의 꿈", artist: "아이유" },
    { id: 3, title: "에잇 (Prod.&Feat. SUGA)", artist: "아이유, SUGA" },
];
function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [q, setQ] = useState("");
    const [selectedPlId, setSelectedPlId] = useState(null);
    const [sidebarMode, setSidebarMode] = useState("list");
    const { playlists, deletePlaylist, addPlaylist, removeTrack, setTracks, updatePlaylist } = usePlaylistStore();

    const [editingListId, setEditingListId] = useState(null);
    const [listDraft, setListDraft] = useState("");
    const selectedPl = playlists.find((p) => p.id === selectedPlId) || null;
    const [plOpen, setPlOpen] = useState(false);

    const onHeaderSearchSubmit = (e) => {
        e.preventDefault();
        const next = q.trim();
        if (!next) return;
        navigate(`/search?q=${encodeURIComponent(next)}`);
    };

    const openTracks = (id) => {
        setSelectedPlId(id);
        setSidebarMode("tracks");
    };

    const backToList = () => {
        setSelectedPlId(null);
        setSidebarMode("list");
    };

    React.useEffect(() => {
        if (location.pathname === "/library") {
            const sp = new URLSearchParams(location.search);
            const id = sp.get("id");
            if (id) {
                setSelectedPlId(Number(id));
                setSidebarMode("tracks");
            } else {
                setSelectedPlId(null);
                setSidebarMode("list");
            }
        }
    }, [location.pathname, location.search]);

    return (
        <div className="app">
            {/* Header 고정 (70px) */}
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
                    <div>Music App</div>

                    {/* 헤더 검색 */}
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

            {/* ✅ 사이드바 (단일 aside만 유지) */}
            <aside className="sidebar">

                <div className="sidebar-head">
                    {sidebarMode === "tracks" ? (
                        <>
                            <button
                                className="back-btn"
                                onClick={backToList}
                                aria-label="back"
                                style={{
                                    marginRight: 8,
                                    background: "none",
                                    border: "none",
                                    color: "#fff",
                                    fontSize: 18,
                                    cursor: "pointer"
                                }}
                            >
                                ←
                            </button>
                            <strong>{selectedPl?.name || "내 라이브러리"}</strong>
                            <button
                                className="icon-btn"
                                aria-label="add"
                                onClick={() => {
                                    const base = "내 플레이리스트";
                                    const n = playlists.filter(p => p.name.startsWith(base)).length + 1;
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
                                aria-label="add"
                                onClick={() => {
                                    const base = "내 플레이리스트";
                                    const n = playlists.filter(p => p.name.startsWith(base)).length + 1;
                                    addPlaylist(`${base} ${n}`);
                                }}
                            >
                                +
                            </button>
                        </>
                    )}
                </div>



                {/* 플레이리스트 1개라도 있으면 카드 숨김 */}
                {playlists.length === 0 && (
                    <div className="sidebar-card">
                        <div className="card-title">첫 번째 플레이리스트를 만드세요.</div>
                        <div className="card-sub">어렵지 않아요. 저희가 도와드릴게요.</div>
                        <button
                            className="card-cta"
                            onClick={() => {
                                const base = "내 플레이리스트";
                                const n = playlists.filter(p => p.name.startsWith(base)).length + 1;
                                addPlaylist(`${base} ${n}`);
                                setSidebarMode("list");
                            }}
                        >
                            플레이리스트 만들기
                        </button>
                    </div>
                )}

                {/* 리스트 모드: 플레이리스트 목록만 */}
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
                                             if (editingListId) return; // 이름 수정 중엔 클릭 무시
                                            if (e.detail === 2) return; // 더블클릭 시 클릭 무시
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
                                                aria-label="delete playlist"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // 리스트 열기 막기
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

                {/* 트랙 모드: 선택된 플레이리스트 트랙 */}
                {sidebarMode === "tracks" && selectedPl && (
                    <section className="sidebar-tracks">
                        <div className="tracks-head">
                            <strong className="tracks-title">{selectedPl.name}</strong>
                            <span className="tracks-count">
                {selectedPl.tracks?.length ?? DUMMY_TRACKS.length}곡
              </span>
                        </div>
                        <ul className="track-list">
                            {(selectedPl.tracks?.length ? selectedPl.tracks : DUMMY_TRACKS).map((t) => (
                                <li key={t.id} className="track-item">
                                    <div className="ti-title">{t.title}</div>
                                    <div className="ti-artist">{t.artist}</div>
                                    <button
                                        className="mini-del"
                                        aria-label="delete track"
                                        onClick={() => {
                                            if (!selectedPl.tracks?.length) {
                                                // 더미를 실제 트랙으로 시드한 뒤 해당 곡 삭제
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
                            ))}
                        </ul>
                    </section>
                )}
            </aside>
            {/* ✅ 여기서 aside 닫힘 (중첩 금지) */}

            {/* 플레이리스트 패널은 사이드바 밖(형제) */}
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
                    <NavLink to="/discover">Discover</NavLink>
                    <NavLink to="/saas">saas</NavLink>
                    <NavLink to="/library">Library</NavLink>
                </nav>

                <section className="page">
                    <Outlet />
                </section>
            </main>

            {/* Footer 고정 (70px) */}
            <footer className="app-footer">
                <div className="inner">© 2025 Your Name</div>
            </footer>
        </div>
    );
}

// 파일 하단 컴포넌트
function PlaylistPanel({ open, onClose, onSelect }) {  // ⬅️ onSelect 추가
    const { playlists, addPlaylist, deletePlaylist, updatePlaylist } = usePlaylistStore();
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
        const n = playlists.filter(p => p.name.startsWith(base)).length + 1;
        addPlaylist(`${base} ${n}`);
    };

    return (
        <div className="pl-panel">
            <div className="pl-panel-head">
                <strong>플레이리스트</strong>
                <button className="icon-btn" aria-label="close" onClick={onClose}>✕</button>
            </div>

            {playlists.length === 0 ? (
                <div className="pl-empty">
                    <div className="title">아직 플레이리스트가 없어요</div>
                    <div className="sub">“새 플레이리스트 만들기”를 눌러 시작해 보세요.</div>
                    <button className="card-cta" onClick={handleCreate}>새 플레이리스트 만들기</button>
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
                                        title="클릭: 열기 / 더블클릭: 이름 수정"
                                        // ✅ 단일 클릭: 사이드바에 이 플레이리스트 열기
                                        onClick={() => onSelect?.(p.id)}
                                        // ✅ 더블클릭: 이름 수정 모드
                                        onDoubleClick={() => { setDraftName(p.name); setEditingId(p.id); }}
                                    >
                                        {p.name}
                                    </div>
                                )}
                                <div className="sub">{p.tracks?.length ?? 0}곡</div>
                            </div>

                            <button className="pl-del" onClick={() => deletePlaylist(p.id)}>삭제</button>
                        </li>
                    ))}
                </ul>
            )}

            {playlists.length > 0 && (
                <div className="pl-panel-foot">
                    <button className="card-cta" onClick={handleCreate}>새 플레이리스트 만들기</button>
                </div>
            )}
        </div>
    );
}


export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="discover" element={<DiscoverPage />} />
                    {/* 헤더 검색 결과 페이지 (Nav에는 없음) */}
                    <Route path="search" element={<SearchPage />} />
                    {/* body 메뉴: saas */}
                    <Route path="saas" element={<SaasPage />} />
                    <Route path="library" element={<LibraryPage />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}
