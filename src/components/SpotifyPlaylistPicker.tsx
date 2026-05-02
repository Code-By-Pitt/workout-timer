import { useEffect, useMemo, useState } from "react";
import {
  getPlaylists,
  getPlaylistTrackCount,
  searchPublicPlaylists,
  type SpotifyPlaylist,
} from "../utils/spotifyApi";
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
  const [searchResults, setSearchResults] = useState<SpotifyPlaylist[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getPlaylists()
      .then(setPlaylists)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Debounced public-playlist search — only fires when query has 2+ chars
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      searchPublicPlaylists(q)
        .then((items) => setSearchResults(items))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const filteredOwn = useMemo(() => {
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
      trackCount: getPlaylistTrackCount(p),
    };
    onSelect(ref);
  }

  function PlaylistRow({ p }: { p: SpotifyPlaylist }) {
    return (
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
            {getPlaylistTrackCount(p)} tracks
          </span>
        </div>
      </button>
    );
  }

  const showPublicSection = search.trim().length >= 2;

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
          placeholder="Search your playlists or all of Spotify"
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

          {!loading && !error && (
            <div className="flex flex-col gap-4">
              {/* Your Playlists */}
              <section className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Your Playlists
                </h4>
                {filteredOwn.length === 0 ? (
                  <p className="py-2 text-xs text-white/50">
                    {playlists.length === 0
                      ? "No playlists in your account"
                      : "No matches"}
                  </p>
                ) : (
                  filteredOwn.map((p) => <PlaylistRow key={p.id} p={p} />)
                )}
              </section>

              {/* Other Public Playlists — only when actively searching */}
              {showPublicSection && (
                <section className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Other Public Playlists
                  </h4>
                  {searching ? (
                    <p className="py-2 text-xs text-white/50">Searching…</p>
                  ) : searchResults.length === 0 ? (
                    <p className="py-2 text-xs text-white/50">No results</p>
                  ) : (
                    searchResults.map((p) => (
                      <PlaylistRow key={`pub-${p.id}`} p={p} />
                    ))
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
