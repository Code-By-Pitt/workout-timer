import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  startLogin,
  logout as doLogout,
  isLoggedIn as hasTokens,
} from "../utils/spotifyAuth";
import { getMe, type SpotifyUser } from "../utils/spotifyApi";

interface SpotifyContextValue {
  loggedIn: boolean;
  user: SpotifyUser | null;
  isPremium: boolean;
  loading: boolean;
  connect: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(hasTokens());
  const [loading, setLoading] = useState<boolean>(hasTokens());

  const refreshUser = useCallback(async () => {
    if (!hasTokens()) {
      setUser(null);
      setLoggedIn(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me);
      setLoggedIn(true);
    } catch {
      setUser(null);
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const connect = useCallback(() => {
    startLogin();
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
    setLoggedIn(false);
  }, []);

  return (
    <SpotifyContext.Provider
      value={{
        loggedIn,
        user,
        isPremium: user?.product === "premium",
        loading,
        connect,
        logout,
        refreshUser,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify(): SpotifyContextValue {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error("useSpotify must be used within SpotifyProvider");
  return ctx;
}
