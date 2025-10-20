// src/hooks/useInfinitePage.jsx
import { useCallback, useEffect, useRef, useState } from "react";

// 트랙 id 추출 (charts {track:{...}} / search { ... } 모두 대응)
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

export function useInfinitePage(fetcher) {
    const [items, setItems] = useState([]);
    const [nextHref, setNextHref] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const loaderRef = useRef(null);

    // 내부 상태 보강
    const seenRef = useRef(new Set());        // ✅ 중복 방지
    const doneRef = useRef(false);            // ✅ 더 이상 로드 안 함
    const inFlightRef = useRef(false);        // ✅ 동시 호출 방지
    const prevNextHrefRef = useRef(null);     // ✅ 커서 정지 감지

    const appendPage = useCallback((page) => {
        const coll = Array.isArray(page?.collection) ? page.collection : [];

        // ✅ 중복 제거 후 추가
        const deduped = [];
        for (const r of coll) {
            const id = getItemId(r);
            const key = id ?? JSON.stringify(r)?.slice(0, 500); // id 없을 때 임시 키
            if (seenRef.current.has(key)) continue;
            seenRef.current.add(key);
            deduped.push(r);
        }

        // 아무 것도 새로 못 넣었고 next가 멈췄으면 종료
        const next = page?.next_href || null;
        if (deduped.length === 0 && (!next || next === prevNextHrefRef.current)) {
            doneRef.current = true;
        }

        if (deduped.length > 0) {
            setItems((prev) => prev.concat(deduped));
        }

        // 커서 업데이트
        setNextHref(next);
        prevNextHrefRef.current = next;
    }, []);

    const load = useCallback(
        async (cursor = null) => {
            if (loading || doneRef.current || inFlightRef.current) return;
            inFlightRef.current = true;
            setLoading(true);
            setError(null);

            try {
                const page = await fetcher(cursor);
                appendPage(page);

                // 다음 커서가 없으면 종료
                if (!page?.next_href) {
                    doneRef.current = true;
                }
            } catch (e) {
                setError(e instanceof Error ? e : new Error("load failed"));
            } finally {
                setLoading(false);
                inFlightRef.current = false;
            }
        },
        [appendPage, fetcher, loading]
    );

    // 최초 로드
    useEffect(() => {
        load(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 인터섹션 옵저버
    useEffect(() => {
        if (!loaderRef.current) return;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting && !loading && !doneRef.current && nextHref) {
                        load(nextHref);
                    }
                });
            },
            { rootMargin: "300px 0px" }
        );
        io.observe(loaderRef.current);
        return () => io.disconnect();
    }, [load, loading, nextHref]);

    const retry = useCallback(() => {
        if (loading) return;
        setError(null);
        // 재시도는 cursor 유지한 채 다시 시도
        if (!doneRef.current) load(nextHref);
    }, [load, loading, nextHref]);

    const reset = useCallback(() => {
        // 필요할 때(장르 변경 등) 외부에서 호출
        setItems([]);
        setNextHref(null);
        setError(null);
        seenRef.current.clear();
        doneRef.current = false;
        prevNextHrefRef.current = null;
        inFlightRef.current = false;
        load(null);
    }, [load]);

    return { items, nextHref, loading, error, retry, reset, loaderRef };
}
