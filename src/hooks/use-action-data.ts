'use client';

import { useState, useEffect } from 'react';

export function useActionData<T>(
    actionFn: () => Promise<T>,
    deps: any[] = []
) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await actionFn();
            setData(res);
        } catch (err: any) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, isLoading, error, refetch: fetchData };
}
