// SoundCloud API 트랙을 PlayerBar가 쓰는 형태로 변환
export function toUiTrack(t) {
    if (!t) return null;
    const user = t.user || {};
    // 썸네일 큰 사이즈 선호
    const art = t.artwork_url || t.user?.avatar_url || null;
    const big = art ? art.replace("-large", "-t500x500") : null;

    return {
        id: t.id,
        title: t.title || "",
        artist: user.username || t.artist || "",
        artwork: big || art,
        permalink: t.permalink_url || t.permalink, // 일부 응답은 permalink_url
        durationMs: typeof t.duration === "number" ? t.duration : null,
        playbackCount: typeof t.playback_count === "number" ? t.playback_count : null,
    };
}
