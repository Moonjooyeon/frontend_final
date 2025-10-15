import React from "react";
import {useNavigate, useParams} from "react-router-dom";

import { usePlaylistStore } from "../playlistStore";

const DUMMY_TRACKS = [
    { id: 1, title: "Love wins all", artist: "아이유" },
    { id: 2, title: "네모의 꿈", artist: "아이유" },
    { id: 3, title: "에잇 (Prod.&Feat. SUGA)", artist: "아이유, SUGA" },
];

export default function PlaylistDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { playlists } = usePlaylistStore();

    const pid = Number(id);
    const pl = playlists.find(p => p.id === pid);

    if (!pl) {
        return (
            <div style={{ padding: 12 }}>
                <h2>플레이리스트를 찾을 수 없어요</h2>
                <button onClick={() => nav("/library")}>내 플레이리스트로 돌아가기</button>
            </div>
        );
    }

    const tracks = pl.tracks?.length ? pl.tracks : DUMMY_TRACKS;

    return (
        <div style={{ display: "grid", gap: 16 }}>
            {/* 상단 히어로 */}
            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr",
                    gap: 16,
                    alignItems: "center",
                    padding: "12px 0 8px",
                    borderBottom: "1px solid rgba(255,255,255,.08)",
                }}
            >
                <div
                    style={{
                        width: 160,
                        height: 160,
                        borderRadius: 12,
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02))",
                    }}
                />
                <div>
                    <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 6 }}>
                        공개 플레이리스트
                    </div>
                    <h1 style={{ margin: 0, fontSize: 48, fontWeight: 900 }}>{pl.name}</h1>
                    <div style={{ opacity: 0.75, marginTop: 6 }}>
                        곡 수: {tracks.length}곡
                    </div>
                </div>
            </section>

            {/* 트랙 테이블 */}
            <section>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr 160px",
                        padding: "8px 8px",
                        opacity: 0.7,
                        borderBottom: "1px solid rgba(255,255,255,.08)",
                        fontSize: 14,
                    }}
                >
                    <div>#</div>
                    <div>제목</div>
                    <div style={{ textAlign: "right" }}>길이</div>
                </div>

                {tracks.map((t, i) => (
                    <div
                        key={t.id}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "40px 1fr 160px",
                            padding: "10px 8px",
                            alignItems: "center",
                            borderBottom: "1px solid rgba(255,255,255,.06)",
                        }}
                    >
                        <div style={{ opacity: 0.7 }}>{i + 1}</div>
                        <div>
                            <div style={{ fontWeight: 700 }}>{t.title}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{t.artist}</div>
                        </div>
                        <div style={{ textAlign: "right", opacity: 0.8 }}>–</div>
                    </div>
                ))}
            </section>
        </div>
    );
}

