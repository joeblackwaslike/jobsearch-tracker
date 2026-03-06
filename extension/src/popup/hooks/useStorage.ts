import { useCallback, useEffect, useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import type { StorageSchema } from "../../shared/storage";

export function useStorage<K extends keyof StorageSchema>(key: K) {
  const [value, setValue] = useState<StorageSchema[K] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStorage(key).then((v) => {
      setValue(v);
      setLoading(false);
    });
  }, [key]);

  const update = useCallback(
    async (newValue: StorageSchema[K]) => {
      await setStorage({ [key]: newValue } as Partial<StorageSchema>);
      setValue(newValue);
    },
    [key],
  );

  return { value, loading, update };
}
