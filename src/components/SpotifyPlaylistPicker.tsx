import { useEffect, useMemo, useState } from "react";
import { getPlaylists, type SpotifyPlaylist } from "../utils/spotifyApi";
import type { SpotifyPlaylistRef } from "../types/timer";

interface SpotifyPlaylistPickerProps {
  onSelect: (playlist: SpotifyPlaylistRef) => void;
  onClose: () => void;
}

export function SpotifyPlaylistPicker({
  onSelect,
  onClose,
}: SpotifyPlaylistPickerProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPlaylists()
      .then(setPlaylists)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, search]);

  function handlePick(p: SpotifyPlaylist) {
    const ref: SpotifyPlaylistRef = {
      id: p.id,
      uri: p.uri,
      name: p.name,
      imageUrl: p.images?.[0]?.url,
      trackCount: p.tracks?.total,
    };
    onSelect(ref);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-md flex-col gap-3 rounded-3xl bg-slate-900 p-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Select Playlist</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-white/60 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your playlists"
          className="rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/40"
        />

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="py-8 text-center text-sm text-white/50">
              Loading your playlists…
            </p>
          )}
          {error && (
            <p className="py-8 text-center text-sm text-red-400">{error}</p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-white/50">
              {playlists.length === 0
                ? "No playlists found in your account"
                : "No playlists match your search"}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePick(p)}
                className="flex items-center gap-3 rounded-xl bg-white/5 p-2 text-left hover:bg-white/10"
              >
                {p.images?.[0]?.url ? (
                  <img
                    src={p.images[0].url}
                    alt=""
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-white/10 text-lg">
                    🎵
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-white/50">
                    {p.tracks?.total ?? 0} tracks
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
