# 🎬 Debrid Media Manager Next

> A modern, premium reimagining of Debrid Media Manager — built with a completely redesigned UI and enhanced user experience.

**Debrid Media Manager Next** (DMM Next) is a free and open source web application that makes it effortless to build, manage, and stream your personal media library using Debrid services like [Real-Debrid](https://real-debrid.com), [AllDebrid](https://alldebrid.com), and [TorBox](https://torbox.app).

---

## ✨ What's New in DMM Next

- 🎨 **Completely redesigned UI** — dark-first, glassmorphic design built with HeroUI
- ⚡ **Faster and more responsive** — optimised Next.js 15 with improved page performance
- 🖌️ **New branding** — custom logo, SVG favicon, and updated PWA manifest
- 🧩 **Modular settings** — settings page split into clean, focused sections
- 🌐 **One-click deployment** — ready for Vercel + Railway / PlanetScale

---

## 🚀 What is a Debrid Service?

Debrid services (Real-Debrid, AllDebrid, TorBox) act as a shared cloud storage for torrents. Files are cached across users, so you get:

- ⚡ Instant downloads at full speed
- ♾️ Virtually unlimited library size
- 📺 Stream directly via WebDAV, Stremio, Plex, Infuse, Emby, or Jellyfin

DMM Next makes it easy to search, download, and curate your entire media collection from one beautiful interface.

---

## 🛠️ Features

### 📚 Library Management
Manage all your torrents in one place — sort by name, size, status, or date. Automatically detects duplicates, failed downloads, and slow torrents.

### 🔍 Torrent Search
Search and add movies or TV shows directly to your Debrid library. Shows what you already have downloaded or currently downloading.

### 🎭 Movie & TV Show Info Pages
Browse rich metadata including cast, crew, trailers, ratings, and related content. Explore full actor/director filmographies.

### 📡 Stremio Integration
Use DMM Next as a Stremio addon to stream your Debrid library directly through Stremio. Includes a Cast addon for stream sharing.

### 🎯 Trakt Integration
Sync your Trakt watchlist, collection, and custom lists to easily add content to your library.

### 🔗 Library Sharing
Share your entire collection or select specific items via shareable hash lists. Mirror other users' libraries instantly.

---

## 🖥️ Quick Deploy (Recommended)

The easiest way to run DMM Next is with **Vercel** + **Railway MySQL**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chargmak/debrid-media-manager-next)

1. Fork or clone this repo to your GitHub
2. Create a MySQL database on [Railway](https://railway.app) or [PlanetScale](https://planetscale.com)
3. Deploy to [Vercel](https://vercel.com) and set your environment variables (see below)
4. Run `npx prisma db push` to initialise your database tables
5. Done! 🎉

---

## ⚙️ Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/chargmak/debrid-media-manager-next.git
cd debrid-media-manager-next

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your settings (see below)

# 4. Set up the database
npx prisma db push

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `DMM_ORIGIN` | ✅ | Your app's public URL (e.g. `https://yourapp.vercel.app`) |
| `DMMCAST_SALT` | ✅ | Random secret string for cast token generation |
| `DMM_MAX_UNCACHED_LINKS` | ☑️ | Max uncached links (default: `50`) |
| `REQUEST_TIMEOUT` | ☑️ | Timeout in ms (default: `5000`) |
| `TMDB_KEY` | ☑️ | [TMDB](https://themoviedb.org) API key for enhanced metadata |
| `OMDB_KEY` | ☑️ | [OMDB](https://omdbapi.com) API key |
| `MDBLIST_KEY` | ☑️ | [MDBList](https://mdblist.com) API key |
| `TRAKT_CLIENT_ID` | ☑️ | Trakt app client ID |
| `TRAKT_CLIENT_SECRET` | ☑️ | Trakt app client secret |

See [`.env.example`](.env.example) for the full list of available options.

---

## 🐳 Docker

```bash
cp .env.example .env.local
# Fill in your settings in .env.local

docker swarm init
docker stack deploy -c docker-compose.yml dmm
```

Available at `http://localhost:3000`

---

## ❓ FAQ

**Why use DMM Next instead of Kodi/Stremio/FEN?**
If you want a curated media library with fine-grained control over quality (e.g. only 100GB+ remux releases), DMM Next is ideal. It's simpler than -arr stacks and doesn't require any monitoring setup.

**Is library sharing anonymous?**
Yes. Shared data is only filename, magnet hash, and file size — compressed into the URL. Nothing is stored in the database.

**How does it know what's in my library?**
It fetches your library when you open the Library page and caches it in your browser's local storage. No background monitoring.

---

## 📄 License

This project is licensed under the [AGPL-3.0](LICENSE).

---

> Built on top of the original [Debrid Media Manager](https://github.com/debridmediamanager/debrid-media-manager) with a fully redesigned interface and modern deployment setup.
