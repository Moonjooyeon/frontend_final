import React, { useEffect, useState } from "react";
import axios from "axios";

export default function HomePage() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await axios.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    {
                        params: {
                            key: "AIzaSyDprw8EpP6Fud5YwsVk4B5ZF2fFe8UDluc", // ✅ API 키
                            part: "snippet,statistics", // ✅ 영상 정보 + 통계
                            id: "4L_YopHT3Gg", // ✅ 테스트용 단일 영상 ID
                        },
                    }
                );

                setVideos(res.data.items || []);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error)
        return (
            <div>
                Error occurred: {error.message || "데이터를 불러오는 중 오류 발생"}
            </div>
        );

    return (
        <div style={{ padding: "20px" }}>
            <h2>Home Page</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {videos.map((video) => (
                    <div
                        key={video.id}
                        style={{
                            width: "320px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "10px",
                        }}
                    >
                        <img
                            src={video.snippet?.thumbnails?.medium?.url}
                            alt={video.snippet?.title}
                            style={{ width: "100%", borderRadius: "8px" }}
                        />
                        <h3 style={{ fontSize: "1.1rem", margin: "10px 0 5px" }}>
                            {video.snippet?.title}
                        </h3>
                        <p style={{ margin: 0, color: "#666" }}>
                            {video.snippet?.channelTitle}
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "#999" }}>
                            조회수: {video.statistics?.viewCount || "정보 없음"}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
