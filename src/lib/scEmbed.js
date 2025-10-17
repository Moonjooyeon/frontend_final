// src/lib/scEmbed.js
export const getSoundCloudEmbedUrl = (scPermalink, { autoPlay = true } = {}) => {
    if (!scPermalink) return null;
    const base = "https://w.soundcloud.com/player/";
    const p = new URLSearchParams({
        url: scPermalink,
        auto_play: autoPlay ? "true" : "false",
        hide_related: "false",
        show_comments: "true",
        show_user: "true",
        show_reposts: "false",
        visual: "false",
    });
    return `${base}?${p.toString()}`;
};
