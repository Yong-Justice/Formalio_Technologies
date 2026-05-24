import { useEffect, useState } from 'react';
import { database, initializeDatabase } from '@/database';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    void initializeDatabase()
      .then(() => {
        if (mounted) setIsReady(true);
      })
      .catch((nextError) => {
        if (mounted) setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { database, isReady, error };
}
