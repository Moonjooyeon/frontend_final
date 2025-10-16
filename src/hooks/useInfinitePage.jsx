// src/hooks/useInfinitePage.js
import { useEffect, useRef, useState } from "react";

export function useInfinitePage(fetcher) {
    const [items, setItems] = useState([]);
    const [nextHref, setNextHref] = useState(null);
    const [loading, setLoading] = useState(false);
    const loaderRef = useRef(null);

    const load = async (cursor = null) => {
        setLoading(true);
        const page = await fetcher(cursor);
        setItems((prev) => [...prev, ...(page.collection || [])]);
        setNextHref(page.next_href || null);
        setLoading(false);
    };

    useEffect(() => {
        load(null); // 첫 페이지
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loaderRef.current) return;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting && !loading && nextHref) {
                        load(nextHref);
                    }
                });
            },
            { rootMargin: "300px" }
        );
        io.observe(loaderRef.current);
        return () => io.disconnect();
    }, [loading, nextHref]);

    return { items, nextHref, loading, loaderRef };
}
