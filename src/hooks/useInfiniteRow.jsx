// src/hooks/useInfiniteRow.jsx
import { useCallback, useEffect, useRef, useState } from "react";

// charts { track:{...} } / search { ... } 혼용 대응용 ID 추출기
const getItemId = (raw) => {
    const x = raw?.track || raw;
    return (
        x?.id ??
        x?.permalink_url ??
        x?.uri ??
        (x?.title && x?.user?.username && `${x.title}@${x.user.username}`) ??
        null
    );
};

export function useInfiniteRow(fetcher) {
    const [items, setItems] = useState([]);
    const [cursor, setCursor] = useState(null); // next_href
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const rowRef = useRef(null);   // 가로 스크롤 컨테이너
    const tailRef = useRef(null);  // 오른쪽 센티넬

    const seenRef = useRef(new Set());
    const doneRef = useRef(false);
    const inFlightRef = useRef(false);
    const prevCursorRef = useRef(null);

    const appendPage = useCallback((page) => {
        const coll = Array.isArray(page?.collection) ? page.collection : [];

        const deduped = [];
        for (const r of coll) {
            const id = getItemId(r) ?? JSON.stringify(r)?.slice(0, 500);
            if (seenRef.current.has(id)) continue;
            seenRef.current.add(id);
            deduped.push(r);
        }

        if (deduped.length > 0) {
            setItems((prev) => prev.concat(deduped));
        }

        const next = page?.next_href || null;
        if (!next || next === prevCursorRef.current) {
            doneRef.current = true;
        }
        prevCursorRef.current = next;
        setCursor(next);
    }, []);

    const load = useCallback(async () => {
        if (loading || doneRef.current || inFlightRef.current) return;
        inFlightRef.current = true;
        setLoading(true);
        setError(null);
        try {
            const page = await fetcher(cursor);
            appendPage(page);
        } catch (e) {
            setError(e instanceof Error ? e : new Error("load failed"));
        } finally {
            setLoading(false);
            inFlightRef.current = false;
        }
    }, [appendPage, cursor, fetcher, loading]);

    // 초기 1회
    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

    // 가로 인터섹션 옵저버(오른쪽 근접시 프리페치)
    useEffect(() => {
        const root = rowRef.current;
        const target = tailRef.current;
        if (!root || !target) return;

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting && !loading && !doneRef.current) {
                        load();
                    }
                });
            },
            {
                root,
                rootMargin: "0px 400px 0px 0px", // 오른쪽 400px 여유 시 로드
                threshold: 0.01,
            }
        );

        io.observe(target);
        return () => io.disconnect();
    }, [load, loading]);

    const retry = useCallback(() => {
        if (loading) return;
        setError(null);
        if (!doneRef.current) load();
    }, [load, loading]);

    const reset = useCallback(() => {
        setItems([]);
        setError(null);
        seenRef.current.clear();
        doneRef.current = false;
        inFlightRef.current = false;
        prevCursorRef.current = null;
        setCursor(null);
        load();
    }, [load]);

    return { items, loading, error, retry, reset, rowRef, tailRef };
}
