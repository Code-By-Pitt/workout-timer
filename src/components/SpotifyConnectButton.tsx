import { useSpotify } from "../hooks/useSpotify";

interface SpotifyConnectButtonProps {
  onBeforeConnect?: () => void;
}

export function SpotifyConnectButton({ onBeforeConnect }: SpotifyConnectButtonProps = {}) {
  const { loggedIn, user, loading, connect, logout } = useSpotify();

  function handleConnect() {
    onBeforeConnect?.();
    connect();
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white/10 px-4 py-2 text-xs text-white/60">
        Checking Spotify…
      </div>
    );
  }

  if (loggedIn && user) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-2 text-xs">
        <span className="text-white/70">
          Spotify: <span className="text-white">{user.display_name ?? user.id}</span>
          {user.product === "free" && (
            <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
              Free
            </span>
          )}
        </span>
        <button
          onClick={logout}
          className="text-white/50 hover:text-white/80"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      <span>🎵</span> Connect Spotify
    </button>
  );
}
