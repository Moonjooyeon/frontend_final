// SoundCloud 트랙을 playlistStore.addItem용 아이템으로 변환
export function scToPlaylistItem(t = {}) {
    const user = t.user || {};
    const art =
        t.artwork ||
        t.artworkUrl ||
        t.artwork_url ||
        user.avatarUrl ||
        user.avatar_url ||
        "";

    const permalink = t.permalink || t.permalinkUrl || t.permalink_url || "";

    return {
        // id는 store의 sanitizeItem에서 보강되므로 생략 가능
        kind: "track",
        source: "soundcloud",
        externalId: String(t.id ?? ""), // 중복 방지 키
        title: t.title || "(Untitled)",
        subtitle: user.username || t.artist || t.username || "",
        durationMs: typeof t.duration === "number" ? t.duration : undefined,
        thumbnail: art,
        url: permalink,
    };
}
