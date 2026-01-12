# Haystack New

Modern, modular TypeScript application for the Haystack content management and knowledge platform. This project tracks and manages companies, people, events, technologies, and insights.

## Technology Stack

- **TypeScript** (ES2016 target)
- **Webpack 5** with dev server
- **Xano JS SDK** (v2.0.1) - Backend API client
- **UI Libraries**: Choices.js, Flatpickr, Toastify-js
- **CKEditor 5** (source editing plugin)
- **Package Manager**: pnpm

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```
Starts Webpack dev server on port 8080 with live reload and CORS enabled.

**Local Development Setup:**
Set the mode to `"true"` in your page script to load from localhost:

```javascript
const mode = "true"; // Loads from http://localhost:8080/dev/userfeedV3.js
```

### Production Build

```bash
pnpm build
```
Compiles all TypeScript files to `dist/` with preserved directory structure.

### Preview

```bash
pnpm start
```
Preview built files using Vite.

## Architecture

### Project Structure

```
haystack_new/
├── src/
│   ├── dev/          # Development environment entry points
│   │   ├── company.ts, companyV3.ts
│   │   ├── people.ts, peopleV3.ts
│   │   ├── event.ts, eventV3.ts
│   │   ├── technology.ts, technologyV3.ts
│   │   ├── userfeed.ts, userfeedV2.ts, userfeedV3.ts
│   │   ├── insight.ts
│   │   ├── sharedInsight.ts
│   │   └── globalSearch.ts
│   └── live/         # Production environment entry points
│       └── (mirrors dev/ structure)
├── utils/            # Feature modules and business logic
│   ├── index.ts      # Core utilities (debounce, qs, qsa, formatters)
│   ├── company/
│   ├── companyV3/
│   ├── people/
│   ├── peopleV3/
│   ├── event/
│   ├── eventV3/
│   ├── technology/
│   ├── technologyV3/
│   ├── userFeed/
│   ├── userFeedV2/
│   ├── userFeedV3/
│   ├── insight/
│   ├── sharedInsight/
│   └── globalSearch/
├── types/
│   └── index.ts      # TypeScript interfaces and type definitions
├── webpack.config.js
├── tsconfig.json
└── package.json
```

### Design Patterns

#### Entry Point Pattern

Each file in `src/dev/` or `src/live/` serves as a minimal entry point:

```typescript
import { companyPageCode } from "../../utils/company";

document.addEventListener("DOMContentLoaded", async () => {
  companyPageCode({ dataSource: "dev" }); // or "live"
});
```

#### Utility Module Pattern

Each util module exports a main async function containing page logic:

```typescript
export async function companyPageCode({
  dataSource,
}: {
  dataSource: "live" | "dev";
}) {
  // Page initialization and logic
}
```

### Build System

Webpack automatically discovers all TypeScript files in `src/` and bundles them into UMD modules:

- **Input**: `src/**/*.ts`
- **Output**: `dist/**/*.js` (preserves folder structure)
- **Library Target**: UMD
- **Code Splitting**: Disabled

Dev server features:
- Hot reload
- CORS enabled
- Port 8080
- Static serving from `dist/`

## Core Utilities

Located in `utils/index.ts`:

- **`debounce(func, delay)`** - Debounce function calls
- **`qs(selector)`** - Query single element (typed)
- **`qsa(selector)`** - Query all elements (typed)
- **`formatCuratedDate(date)`** - Format dates for display
- **`toSentenceCase(str)`** - Convert to sentence case

## API Integration

### Xano Backend

Multiple Xano API groups for different features:

```typescript
const xano_client = new XanoClient({
  apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:xxxxx"
}).setDataSource(dataSource);
```

**API Groups:**
- `:CvEH0ZFk` - Individual pages (company, people, events, tech)
- `:6Ie7e140` - WMX
- `:Hv8ldLVU` - User Feed
- `:L71qefry` - Shared Insight pages

### Data Sources

- **`dev`** - Development environment
- **`live`** - Production environment

## Content Types

### Companies
- Logo, website, company type
- Line of business
- Related insights, people, technologies

### People
- Name, title, company affiliation
- Related insights and companies

### Events
- Name, slug
- Related insights and attendees

### Technologies
- Technology categories
- Related companies and insights

### Insights
- Rich text articles/documents (CKEditor)
- Tags and classifications
- Company/people/event mentions
- Source documents and attribution
- Curated and published dates

### User Feed
- Personalized content streams
- V2 and V3 API versions available

## Key Features

### Version Strategy

V3 versions running alongside original versions:
- `company.ts` / `companyV3.ts`
- `people.ts` / `peopleV3.ts`
- `event.ts` / `eventV3.ts`
- `technology.ts` / `technologyV3.ts`
- `userfeed.ts` / `userfeedV2.ts` / `userfeedV3.ts`

### Shared Insights

Public sharing feature for insights:
- Share via token: `?share-token=xxx`
- Login-gated content links
- Custom tooltip system for locked elements
- Intro overlay with preview

**Usage:**
```typescript
// Custom attribute for tooltips
element.setAttribute("data-tippy-content", "Tooltip text");
element.setAttribute("data-tippy-placement", "left");
element.setAttribute("data-tippy-arrow", "true");
element.setAttribute("data-tippy-duration", "300");

// Or use dev-tooltip attribute
<a href="/login" dev-tooltip>Link text</a>
```

### DOM Conventions

Custom data attributes for consistent querying:

```typescript
// Templates
const template = qs(`[dev-template="insight-tag"]`);

// Target elements
const element = qs(`[dev-target="company-card"]`);

// Input types
input.setAttribute("dev-input-type", "company_id");
input.setAttribute("dev-input-id", "123");

// Visibility control
element.setAttribute("dev-hide", "false");
```

### Search & Filtering

Multi-faceted filtering system:

```typescript
interface SearchObject {
  search: string;
  checkboxes: {
    companyType: number[];
    sourceCat: number[];
    techCat: number[];
    lineOfBus: number[];
    insightClass: number[];
  };
}
```

### Rich Text Tables

Custom horizontal scroll implementation:
- Top scrollbar injection
- Synchronized scrolling
- Responsive width adjustment
- Auto-hide when no overflow

## Type Definitions

Key TypeScript interfaces in `types/index.ts`:

- **`InsightPayload`** - Pagination and filtering for insights
- **`Insight`** - Insight list response
- **`InsightResponse`** - Single insight detail
- **`Company`** - Company data structure
- **`FilterResponse`** - Filter options
- **`SearchObject`** - Search state
- **`UserFollowingAndFavourite`** - User preferences
- **`PersonInsightResponse`** - People-related insights

## Development Notes

### Environment Separation

This project uses a `dev/live` folder structure for environment-specific builds, rather than environment variables. Each environment has its own bundled entry points.

### Migration from haystack2.0

This is a refactored version with improvements:
- ✅ Modular architecture (utils separation)
- ✅ Modern build tooling (Webpack 5)
- ✅ Better type safety
- ✅ Environment isolation
- ✅ Updated dependencies (Xano SDK v2)

### Code Style

- Use `qs()` and `qsa()` for DOM queries
- Prefer `dev-target` attributes over class-based selection
- Clone templates for dynamic content
- Always type HTMLElement queries with specific element types

## Deployment Workflow

### Development Mode

1. **Start local server:**
   ```bash
   pnpm dev
   ```
   This runs Webpack dev server on `localhost:8080`

2. **Set mode in your page:**
   ```javascript
   const mode = "true"; // Enable local development
   ```
   Script will load from: `http://localhost:8080/dev/{page}.js`

### Branch Deployment

1. **Build the project:**
   ```bash
   pnpm build
   ```

2. **Commit and push to your branch:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin your-branch
   ```

3. **Copy the commit hash** (e.g., `0485133`)

4. **Update the page script:**
   ```javascript
   const mode = "branch";
   const script = document.createElement("script");
   script.src = "https://cdn.jsdelivr.net/gh/BX-Studio-Webflow/haystack_new@0485133/dist/dev/userfeedV3.js";
   ```

### Production Deployment

1. **Build and merge to main:**
   ```bash
   pnpm build
   git push origin main
   ```

2. **Copy the commit hash** from main branch (e.g., `357ef52`)

3. **Update the page script:**
   ```javascript
   const mode = "prod";
   const script = document.createElement("script");
   script.src = "https://cdn.jsdelivr.net/gh/BX-Studio-Webflow/haystack_new@357ef52/dist/{page}.js";
   ```

### Script Loading Pattern

Pages use this pattern to load the appropriate version:

```javascript
// dev-mode has 3 possible values: "true", "branch", "prod"
const mode = "prod";
const script = document.createElement("script");
script.src =
  mode === "true"
    ? "http://localhost:8080/dev/userfeedV3.js"
    : mode === "branch"
      ? "https://cdn.jsdelivr.net/gh/BX-Studio-Webflow/haystack_new@0485133/dist/dev/userfeedV3.js?v=11234"
      : "https://cdn.jsdelivr.net/gh/BX-Studio-Webflow/haystack_new@357ef52/dist/userfeedV3.js";

script.onload = () => {
  console.log("Script loaded successfully for mode:", mode);
};
script.onerror = () => {
  console.error("Failed to load script for mode:", mode, "URL:", script.src);
};

document.head.appendChild(script);
```

**Mode Breakdown:**
- **`"true"`** - Local development (localhost:8080)
- **`"branch"`** - Branch testing (CDN with specific commit hash)
- **`"prod"`** - Production (CDN with main branch commit hash)

**Note:** jsDelivr CDN automatically serves files from the GitHub repository at specific commit hashes.

## Contributing

When adding new pages:

1. Create entry point in `src/dev/` and `src/live/`
2. Implement logic in `utils/{feature}/index.ts`
3. Export main async function with `dataSource` parameter
4. Add types to `types/index.ts` if needed
5. Use consistent DOM attribute conventions
6. Test locally with `pnpm dev` and `mode = "true"`
7. Build, push, and deploy using workflow above

## GitHub Repository

**Repository:** `BX-Studio-Webflow/haystack_new`

Files are served via jsDelivr CDN:
```
https://cdn.jsdelivr.net/gh/BX-Studio-Webflow/haystack_new@{commit-hash}/dist/{path}
```

## License

ISC
