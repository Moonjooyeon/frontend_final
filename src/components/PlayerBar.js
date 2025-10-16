// src/components/PlayerBar.js
import React, { useMemo, useRef, useEffect } from "react";
import { useNowPlayingStore } from "../useNowPlayingStore";

// 외부 스크립트 로더 (한 번만 로드)
function loadScWidgetScript() {
    return new Promise((resolve, reject) => {
        if (window.SC && window.SC.Widget) return resolve(window.SC);
        const id = "sc-widget-api";
        if (document.getElementById(id)) {
            // 이미 로드 중이면 폴링
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
    // ✅ 개별 selector (무한 리렌더 방지)
    const isOpen     = useNowPlayingStore((s) => s.isOpen);
    const current    = useNowPlayingStore((s) => s.current);
    const playing    = useNowPlayingStore((s) => s.playing);
    const toggle     = useNowPlayingStore((s) => s.toggle);
    const close      = useNowPlayingStore((s) => s.close);
    const setPlaying = useNowPlayingStore((s) => s.setPlaying);

    const iframeRef = useRef(null);
    const widgetRef = useRef(null); // SC.Widget 인스턴스

    // 위젯 src (첫 로드용)
    const widgetSrc = useMemo(() => {
        if (!current || !current.permalink) return null;
        const url = new URL("https://w.soundcloud.com/player/");
        const params = new URLSearchParams({
            url: current.permalink,
            auto_play: "true",        // 사용자 클릭 직후라 허용됨
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
    }, [current]);

    // 위젯 초기화 & 트랙 변경 시 로드 + 재생
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!isOpen || !current || !current.permalink) return;
            try {
                const SC = await loadScWidgetScript();
                if (cancelled) return;

                // 위젯 인스턴스 생성 (최초 1회)
                if (!widgetRef.current && iframeRef.current) {
                    widgetRef.current = SC.Widget(iframeRef.current);
                    // 이벤트 바인딩 (재생 상태 동기화)
                    widgetRef.current.bind(SC.Widget.Events.PLAY, () => setPlaying(true));
                    widgetRef.current.bind(SC.Widget.Events.PAUSE, () => setPlaying(false));
                    widgetRef.current.bind(SC.Widget.Events.FINISH, () => setPlaying(false));
                }

                // 트랙 로드(+자동재생)
                if (widgetRef.current) {
                    widgetRef.current.load(current.permalink, {
                        auto_play: true,
                        buying: false,
                        sharing: false,
                        show_comments: false,
                        show_user: true,
                        show_reposts: false,
                        visual: false,
                        hide_related: true,
                        single_active: true,
                    });
                }
            } catch (e) {
                console.warn(e);
            }
        })();
        return () => { cancelled = true; };
    }, [isOpen, current, setPlaying]);

    if (!isOpen || !current) return null;

    // --- 렌더 (JSX 없이)
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
        // widget
        React.createElement(
            "div",
            { style: { height: 56, overflow: "hidden", borderRadius: 8 } },
            widgetSrc
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
                : null
        ),
        // controls
        React.createElement(
            "div",
            { style: { display: "flex", gap: 8, justifyContent: "flex-end" } },
            React.createElement(
                "a",
                {
                    href: current.permalink,
                    target: "_blank",
                    rel: "noreferrer",
                    style: { color: "#9cf", textDecoration: "none", alignSelf: "center" },
                },
                "Open"
            ),
            React.createElement(
                "button",
                {
                    onClick: () => {
                        const w = widgetRef.current;
                        if (!w) return;
                        if (playing) {
                            w.pause();
                            setPlaying(false);
                        } else {
                            w.play();
                            setPlaying(true);
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
            React.createElement(
                "button",
                {
                    onClick: () => {
                        const w = widgetRef.current;
                        if (w) w.pause();
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
