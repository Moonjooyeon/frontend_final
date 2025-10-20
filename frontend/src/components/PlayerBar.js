// src/components/PlayerBar.js
import React, { useMemo, useRef, useEffect } from "react";
import { useNowPlayingStore } from "../useNowPlayingStore";

// 외부 스크립트 로더 (SoundCloud)
function loadScWidgetScript() {
    return new Promise((resolve, reject) => {
        if (window.SC && window.SC.Widget) return resolve(window.SC);
        const id = "sc-widget-api";
        if (document.getElementById(id)) {
            const iv = setInterval(() => {
                if (window.SC && window.SC.Widget) {
                    clearInterval(iv);
                    resolve(window.SC);
                }
            }, 50);
            setTimeout(() => { clearInterval(iv); reject(new Error("SC widget load timeout")); }, 10000);
            return;
        }
        const s = document.createElement("script");
        s.id = id;
        s.src = "https://w.soundcloud.com/player/api.js";
        s.async = true;
        s.onload = () => resolve(window.SC);
        s.onerror = () => reject(new Error("Failed to load SC widget api.js"));
        document.head.appendChild(s);
    });
}

export default function PlayerBar() {
    // ✅ store selectors
    const isOpen     = useNowPlayingStore((s) => s.isOpen);
    const current    = useNowPlayingStore((s) => s.current);
    const playing    = useNowPlayingStore((s) => s.playing);
    const toggle     = useNowPlayingStore((s) => s.toggle);
    const close      = useNowPlayingStore((s) => s.close);
    const setPlaying = useNowPlayingStore((s) => s.setPlaying);

    const iframeRef = useRef(null);
    const widgetRef = useRef(null); // SC.Widget
    const audioRef  = useRef(null); // HTML5 audio

    // === 트랙 타입 감지 ==========================================
    const isSC = useMemo(() => {
        if (!current) return false;
        // 우선순위: permalink 존재 → SC, 아니면 url에 soundcloud.com 포함
        if (current.permalink) return true;
        if (typeof current.url === "string" && current.url.includes("soundcloud.com")) return true;
        return false;
    }, [current]);

    // SC 위젯 src (첫 로드용)
    const widgetSrc = useMemo(() => {
        if (!isSC || !current) return null;
        const permalink = current.permalink || current.url; // 둘 중 하나
        if (!permalink) return null;
        const url = new URL("https://w.soundcloud.com/player/");
        const params = new URLSearchParams({
            url: permalink,
            auto_play: "false",        // 위젯 ready후 play()로 제어
            buying: "false",
            sharing: "false",
            show_comments: "false",
            show_user: "true",
            show_reposts: "false",
            visual: "false",
            hide_related: "true",
            single_active: "true",
        });
        url.search = params.toString();
        return url.toString();
    }, [isSC, current]);

    // === SoundCloud 위젯 초기화 & 트랙 로드 =======================
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!isOpen || !isSC || !current) return;
            const permalink = current.permalink || current.url;
            if (!permalink) return;

            try {
                const SC = await loadScWidgetScript();
                if (cancelled) return;

                // 인스턴스 생성 (최초 1회)
                if (!widgetRef.current && iframeRef.current) {
                    widgetRef.current = SC.Widget(iframeRef.current);
                    widgetRef.current.bind(SC.Widget.Events.PLAY,   () => setPlaying(true));
                    widgetRef.current.bind(SC.Widget.Events.PAUSE,  () => setPlaying(false));
                    widgetRef.current.bind(SC.Widget.Events.FINISH, () => setPlaying(false));
                }

                // 트랙 로드 후 상태에 맞춰 재생/일시정지
                if (widgetRef.current) {
                    widgetRef.current.load(permalink, {
                        auto_play: false, // 로드 후 play()를 직접 호출
                        buying: false,
                        sharing: false,
                        show_comments: false,
                        show_user: true,
                        show_reposts: false,
                        visual: false,
                        hide_related: true,
                        single_active: true,
                    });

                    // 위젯이 ready → 원하는 상태로
                    widgetRef.current.bind(SC.Widget.Events.READY, () => {
                        if (playing) widgetRef.current?.play();
                    });
                }
            } catch (e) {
                console.warn(e);
            }
        })();
        return () => { cancelled = true; };
    }, [isOpen, isSC, current, setPlaying, playing]);

    // playing 토글이 바뀔 때 위젯 제어
    useEffect(() => {
        if (!isSC) return;
        const w = widgetRef.current;
        if (!w) return;
        if (playing) w.play(); else w.pause();
    }, [isSC, playing]);

    // === 일반 오디오(<audio>) 폴백 ================================
    const audioSrc = useMemo(() => {
        if (isSC || !current) return null;
        // 우선순위: audioUrl → url
        return current.audioUrl || current.url || null;
    }, [isSC, current]);

    // playing 변경/트랙 변경 시 <audio> 제어
    useEffect(() => {
        if (isSC) return; // SC일 때는 위젯으로 처리
        const el = audioRef.current;
        if (!el) return;
        const doPlay = () => {
            const p = el.play();
            if (p && typeof p.then === "function") p.catch(() => {}); // 무음 실패 무시
        };
        if (playing) doPlay(); else el.pause();
    }, [isSC, playing, audioSrc]);

    if (!isOpen || !current) return null;

    // --- 렌더
    return React.createElement(
        "div",
        {
            style: {
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                height: 72,
                background: "#111",
                color: "#fff",
                borderTop: "1px solid #222",
                display: "grid",
                gridTemplateColumns: "64px 1fr 360px 120px",
                alignItems: "center",
                gap: 12,
                padding: "8px 12px",
                zIndex: 50,
            },
        },
        // artwork
        React.createElement("img", {
            src: current.artwork || "/placeholder.png",
            alt: "",
            style: { width: 56, height: 56, borderRadius: 8, objectFit: "cover" },
        }),
        // meta
        React.createElement(
            "div",
            { style: { overflow: "hidden" } },
            React.createElement(
                "div",
                {
                    style: {
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                    },
                },
                current.title
            ),
            React.createElement(
                "div",
                {
                    style: {
                        opacity: 0.7,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                    },
                },
                current.artist
            )
        ),
        // player area: SC 위젯 or <audio>
        React.createElement(
            "div",
            { style: { height: 56, overflow: "hidden", borderRadius: 8 } },
            isSC && widgetSrc
                ? React.createElement("iframe", {
                    ref: (el) => (iframeRef.current = el),
                    title: "sc-player",
                    width: "100%",
                    height: "56",
                    allow: "autoplay; encrypted-media",
                    scrolling: "no",
                    frameBorder: "no",
                    src: widgetSrc,
                })
                : audioSrc
                    ? React.createElement("audio", {
                        ref: (el) => (audioRef.current = el),
                        src: audioSrc,
                        autoPlay: true,              // 첫 클릭 제스처에 붙여서 브라우저 허용
                        controls: true,
                        style: { width: "100%", height: 56 },
                        onPlay:  () => setPlaying(true),
                        onPause: () => setPlaying(false),
                        onCanPlay: () => { if (playing) audioRef.current?.play?.(); },
                    })
                    : null
        ),
        // controls
        React.createElement(
            "div",
            { style: { display: "flex", gap: 8, justifyContent: "flex-end" } },
            // 원본 열기
            (current.permalink || current.url) &&
            React.createElement(
                "a",
                {
                    href: current.permalink || current.url,
                    target: "_blank",
                    rel: "noreferrer",
                    style: { color: "#9cf", textDecoration: "none", alignSelf: "center" },
                },
                "Open"
            ),
            // 재생/일시정지
            React.createElement(
                "button",
                {
                    onClick: () => {
                        if (isSC) {
                            const w = widgetRef.current;
                            if (!w) return;
                            if (playing) { w.pause(); setPlaying(false); }
                            else { w.play(); setPlaying(true); }
                        } else {
                            const el = audioRef.current;
                            if (!el) return;
                            if (playing) { el.pause(); setPlaying(false); }
                            else { el.play(); setPlaying(true); }
                        }
                    },
                    style: {
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #333",
                        background: "#1e1e1e",
                        color: "#fff",
                    },
                },
                playing ? "Pause" : "Play"
            ),
            // 닫기
            React.createElement(
                "button",
                {
                    onClick: () => {
                        if (isSC && widgetRef.current) widgetRef.current.pause();
                        if (!isSC && audioRef.current)  audioRef.current.pause();
                        close();
                    },
                    style: {
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #333",
                        background: "#1e1e1e",
                        color: "#fff",
                    },
                },
                "✕"
            )
        )
    );
}
