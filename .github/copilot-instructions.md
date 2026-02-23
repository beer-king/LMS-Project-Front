# LMS Project Copilot Instructions

## Project Overview
A **Vue 3 + Quasar 2 Learning Management System** featuring video lectures with progress tracking and live video conferencing. The app uses:
- **Framework**: Quasar (Vue 3 SFC with `<script setup>`)
- **Routing**: Vue Router 4 with hash mode (`vueRouterMode: 'hash'` in quasar.config.js)
- **Video**: video.js library with custom progress tracking and sequential lecture enforcement
- **Live Classes**: Jitsi Meet integration for real-time video conferencing
- **State**: Primarily localStorage for video progress, minimal server interaction currently

## Architecture Patterns

### Layout + Page Structure
- **[LmsMainLayout.vue](src/layouts/LmsMainLayout.vue)**: Main layout with lecture sidebar drawer. Manages `lectureList` (hardcoded test data with 10 videos) and `currentLecture` state. Passes `lecture-data` prop to child pages via `<router-view>`.
- **[IndexPage.vue](src/pages/IndexPage.vue)**: Displays video lectures using `VideoPlayer` component. Receives `lectureData` prop and passes it to the VideoPlayer.
- **[RemoteClass.vue](src/pages/RemoteClass.vue)**: Jitsi Meet integration for live classes (separate route at `/remote`).

### Component Communication
- **Parent → Child**: Props (e.g., `lectureData`, `options`, `lectureId`)
- **Child → Storage**: localStorage for persistence (`lecture_progress_${lectureId}`)
- **No global state**: Currently no Pinia/Vuex; all state is local to components

### VideoPlayer Component ([VideoPlayer.vue](src/components/VideoPlayer.vue))
Core features:
1. **Sequential Playback Enforcement**: Users cannot skip ahead more than 2 seconds beyond their saved progress. Attempting to do so resets playback to last watched position.
2. **Progress Tracking**: Updates every 10 seconds (throttled to prevent excessive saves) using localStorage key pattern `lecture_progress_${lectureId}`.
3. **Resume from Last Position**: Displays notification offering to resume or restart from beginning.
4. **video.js Integration**: Custom playback rates (0.5x, 1x, 1.5x, 2x) via `player.on('timeupdate')` and `player.on('ended')` events.

## Key Implementation Patterns

### Props Pattern
Use `computed()` for derived data from props:
```javascript
const videoOptions = computed(() => ({
  sources: [{ src: props.lectureData.url, type: 'video/mp4' }],
  // other options
}))
```
This ensures VideoPlayer re-initializes when lecture changes.

### Reactive State Management
- Use `ref()` for component-level state (e.g., `leftDrawerOpen`, `progress`)
- localStorage is the single source of truth for progress persistence
- Quasar `$q.notify()` for toast notifications (progress warnings, resume prompts)

### Styling Conventions
- Quasar utility classes: `q-mt-md`, `q-pa-md`, `q-mb-md`, `bg-grey-9`, `flex flex-center`
- SCSS in `src/css/app.scss` and `src/css/quasar.variables.scss`
- video.js CSS imported in quasar.config.js: `'~video.js/dist/video-js.css'`

## Build & Development

### Scripts
```bash
quasar dev          # Start dev server with hot reload
quasar build        # Production build
npm run lint        # ESLint check (flat config in eslint.config.js)
npm run format      # Prettier format
```

### Configuration Notes
- **Vue Router Mode**: Hash-based routing (`/#/` URLs) for static hosting compatibility
- **Build Target**: ES2022 browser, Node 20 (see `quasar.config.js`)
- **Linter**: ESLint with flat config, vue-eslint-parser
- **Dev Server**: Vite with vite-plugin-checker for real-time eslint errors

## File Organization
```
src/
  layouts/LmsMainLayout.vue    # Main layout with lecture sidebar
  pages/IndexPage.vue          # Video lecture page
  pages/RemoteClass.vue        # Jitsi live class page
  components/VideoPlayer.vue   # video.js wrapper with progress tracking
  router/                      # Vue Router config (hash mode)
  css/                         # SCSS global styles
```

## Common Tasks

### Adding a New Lecture
1. Update `lectureList` in [LmsMainLayout.vue](src/layouts/LmsMainLayout.vue) with `{ id, title, url, duration }`
2. VideoPlayer and progress tracking work automatically via `lectureId` prop

### Modifying Progress Logic
Edit `player.on('timeupdate')` handler in [VideoPlayer.vue](src/components/VideoPlayer.vue). Current logic:
- Rewinds if attempting to skip >2 seconds ahead
- Updates localStorage every 10 seconds
- Rewind (going backwards) is always allowed

### Integrating Backend
Replace localStorage calls in VideoPlayer with axios calls to backend API for progress persistence. Current pattern:
```javascript
const savedTime = localStorage.getItem(`lecture_progress_${props.lectureId}`)
// Future: const { progress } = await axios.get(`/api/lectures/${lectureId}/progress`)
```

## Testing & Linting
- **Test**: Currently `echo "No test specified"` (see package.json)
- **Lint**: `npm run lint` uses eslint.config.js (flat config format)
- **Format**: Prettier configured for Vue, JS, SCSS, HTML, MD, JSON files

## External Dependencies
- **video.js**: Video player (configured with custom playback rates in computed options)
- **Jitsi Meet External API**: Loaded dynamically in RemoteClass.vue via `https://meet.jit.si/external_api.js`
- **axios**: HTTP client (currently unused; ready for backend integration)
- **Quasar**: UI framework with pre-built components (q-layout, q-drawer, q-btn, q-notify, etc.)

## Notes for AI Agents
- Lecture data is currently hardcoded; expect backend integration work
- All styling uses Quasar utilities or global SCSS—avoid inline styles
- Use `<script setup>` syntax consistently across all Vue components
- Maintain sequential playback enforcement when modifying VideoPlayer
- Test with different video sources and network conditions (especially progress persistence)
