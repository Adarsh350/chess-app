# Graph Report - .  (2026-08-03)

## Corpus Check
- 73 files · ~33,461 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 343 nodes · 765 edges · 19 communities (15 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 20 edges
2. `reviewReplayPath()` - 18 edges
3. `compilerOptions` - 18 edges
4. `buildInstantReport()` - 15 edges
5. `parseGame()` - 14 edges
6. `studentOverviewPath()` - 13 edges
7. `DashboardRoute()` - 13 edges
8. `EmptyState()` - 12 edges
9. `importPath()` - 11 edges
10. `reviewTitleForDisplay()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `LegacyStudentRedirect()` --calls--> `studentOverviewPath()`  [EXTRACTED]
  src/App.tsx → src/lib/routes.ts
- `LegacyReviewRedirect()` --calls--> `reviewReplayPath()`  [EXTRACTED]
  src/App.tsx → src/lib/routes.ts
- `AppShell()` --calls--> `ensureSeedData()`  [EXTRACTED]
  src/components/AppShell.tsx → src/lib/db.ts
- `AppShell()` --calls--> `importPath()`  [EXTRACTED]
  src/components/AppShell.tsx → src/lib/routes.ts
- `StudentDetailFrame()` --calls--> `studentEditPath()`  [EXTRACTED]
  src/components/StudentDetailFrame.tsx → src/lib/routes.ts

## Import Cycles
- None detected.

## Communities (19 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (50): LegacyReviewRedirect(), LegacyStudentRedirect(), EmptyState(), EmptyStateProps, PageHeader(), PageHeaderProps, ReviewDetailFrame(), ReviewDetailFrameProps (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (34): PgnDropZone(), PgnDropZoneProps, demoGames, demoStudent, parseGame(), archiveStudentProfile(), buildInstantAnalysis(), buildStoredGame() (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (32): clamp(), classifyCpl(), EngineEvaluation, fenTurn(), normalizeScore(), phaseScoreFromAverageCpl(), runDeepEngineReview(), StockfishSession (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (34): chess.js, clsx, dexie, dexie-react-hooks, @fontsource/manrope, @fontsource/space-grotesk, lucide-react, dependencies (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (29): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (26): DOM, DOM.Iterable, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (24): archetypeFromMetrics(), buildActionChecklist(), buildHeuristicCriticalMoments(), buildHeuristicPhaseScores(), buildLeaks(), buildSessionAgenda(), buildStrengths(), buildStyleFingerprint() (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (22): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (11): BoardPreview(), BoardPreviewProps, expandBoard(), PIECES, MoveList(), MoveListProps, saveDeepAnalysis(), useReviewRecord() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.52
Nodes (4): c(), f(), i(), l()

### Community 10 - "Community 10"
Cohesion: 0.43
Nodes (5): App(), registerServiceWorker(), sameOriginPath(), STATIC_URLS, warmOfflineCache()

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (3): CORE_ASSETS, getBuildAssets(), normalizeAssetPath()

### Community 12 - "Community 12"
Cohesion: 0.40
Nodes (4): AppShell(), navItems, BrandMark(), BrandMarkProps

## Knowledge Gaps
- **102 isolated node(s):** `name`, `private`, `version`, `description`, `type` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 4` to `Community 3`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `runDeepEngineReview()` connect `Community 2` to `Community 8`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1104006820119352 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10853658536585366 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08232118758434548 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._