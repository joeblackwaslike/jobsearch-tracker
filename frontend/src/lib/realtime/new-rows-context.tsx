import { createContext, useCallback, useContext, useRef, useState } from "react";

interface NewRowsContextValue {
  newIds: Set<string>;
  addNewId: (id: string) => void;
}

const NewRowsContext = createContext<NewRowsContextValue>({
  newIds: new Set(),
  addNewId: () => {},
});

export function NewRowsProvider({ children }: { children: React.ReactNode }) {
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const addNewId = useCallback((id: string) => {
    setNewIds((prev) => new Set([...prev, id]));

    // Clear any existing timer for this id
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);

    // Remove after 2s
    const timer = setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      timersRef.current.delete(id);
    }, 2000);

    timersRef.current.set(id, timer);
  }, []);

  return (
    <NewRowsContext.Provider value={{ newIds, addNewId }}>
      {children}
    </NewRowsContext.Provider>
  );
}

export function useNewRows() {
  return useContext(NewRowsContext);
}
