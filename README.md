# Shopify App Spy Frontend

A Next.js dashboard for analyzing Shopify App Store data. Connects to a Turso database populated by the [shopify-spy](https://github.com/yourusername/shopify-spy) scraper.

## Features

- **Dashboard** - Overview with key metrics and top performing apps
- **App Explorer** - Advanced filtering by category, rating, recent reviews, trending score, and price
- **Trending** - Apps ranked by trending score (% of recent vs total reviews) or recent activity
- **Dark Mode** - Press `d` to toggle

## Tech Stack

- Next.js 16 (App Router + Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui (radix-mira style)
- Turso (SQLite)

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables in `.env.local`:
```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

3. Run the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── api/
│   ├── apps/        # GET /api/apps - List/search apps
│   ├── keywords/    # GET /api/keywords - List categories
│   └── stats/       # GET /api/stats - Database stats
├── dashboard/
│   ├── layout.tsx   # Sidebar layout
│   ├── page.tsx     # Dashboard overview
│   ├── explorer/    # Advanced filtering
│   ├── trending/    # Trending apps
│   └── settings/    # App info
├── layout.tsx       # Root layout
└── page.tsx         # Redirects to /dashboard

components/ui/       # shadcn components
lib/
├── db.ts           # Turso database client
└── utils.ts        # Utility functions
```

## Available Filters (App Explorer)

- **Categories** - Multi-select by keyword
- **Rating** - Min/max star rating
- **Recent Reviews (30d)** - Min/max reviews in last 30 days
- **Trending Score** - Min/max trending score (% of recent vs total reviews)
- **Price** - Free, Paid, or All

**Trending Score** helps identify new/trending apps. A high score (e.g., 80%) means most of the app's reviews came recently, indicating it's gaining traction.

## Data Source

This frontend connects to a Turso database that is populated by the `shopify-spy` Go scraper. The scraper searches the Shopify App Store by keyword and stores app details including ratings, reviews, and relevance scores.

## License

MIT
