import { useState, useCallback, useRef } from "react";

export function useScSearch() {
    const [items, setItems] = useState([]);
    const [next, setNext] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const abortRef = useRef(null);

    const run = async (url) => {
        // 이전 요청 취소
        if (abortRef.current) abortRef.current.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setLoading(true);
        setErr(null);
        try {
            const res = await fetch(url, { signal: ac.signal });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${text || ""}`);
            }
            const data = await res.json();
            return data;
        } finally {
            setLoading(false);
        }
    };

    const search = useCallback(async ({ q = "", genre = "all-music", limit = 12 }) => {
        const qs = new URLSearchParams({ q, genre, limit: String(limit) });
        const data = await run(`/api/sc/search?${qs.toString()}`);
        setItems(data.items || []);
        setNext(data.next || null);
    }, []);

    const loadMore = useCallback(async () => {
        if (!next) return;
        const data = await run(`/api/sc/search?cursor=${encodeURIComponent(next)}`);
        setItems(prev => [...prev, ...(data.items || [])]);
        setNext(data.next || null);
    }, [next]);

    return { items, next, loading, error: err, search, loadMore };
}
