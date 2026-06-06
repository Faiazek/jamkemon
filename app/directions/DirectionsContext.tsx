"use client";

// Shared directions state: whether the directions panel is open, and the route
// line to draw on the map (with a key so the map re-fits its view to it).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type DirectionsContextValue = {
  active: boolean;
  route: [number, number][] | null;
  routeKey: number;
  open: () => void;
  close: () => void;
  setRoute: (coords: [number, number][] | null) => void;
};

const DirectionsContext = createContext<DirectionsContextValue | null>(null);

export function DirectionsProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [route, setRouteState] = useState<[number, number][] | null>(null);
  const [routeKey, setRouteKey] = useState(0);

  const open = useCallback(() => setActive(true), []);
  const close = useCallback(() => {
    setActive(false);
    setRouteState(null);
  }, []);
  const setRoute = useCallback((coords: [number, number][] | null) => {
    setRouteState(coords);
    setRouteKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({ active, route, routeKey, open, close, setRoute }),
    [active, route, routeKey, open, close, setRoute]
  );

  return (
    <DirectionsContext.Provider value={value}>
      {children}
    </DirectionsContext.Provider>
  );
}

export function useDirections() {
  const ctx = useContext(DirectionsContext);
  if (!ctx) throw new Error("useDirections must be used inside DirectionsProvider");
  return ctx;
}
