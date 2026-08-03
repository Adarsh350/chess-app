# Graph Report - .  (2026-08-03)

## Corpus Check
- 73 files · ~33,463 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 344 nodes · 766 edges · 18 communities (14 shown, 4 thin omitted)
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
- `AppShell()` --calls--> `importPath()`  [EXTRACTED]
  src/components/AppShell.tsx → src/lib/routes.ts
- `ReviewDetailFrame()` --calls--> `reviewReplayPath()`  [EXTRACTED]
  src/components/ReviewDetailFrame.tsx → src/lib/routes.ts
- `ReviewDetailFrame()` --calls--> `studentOverviewPath()`  [EXTRACTED]
  src/components/ReviewDetailFrame.tsx → src/lib/routes.ts

## Import Cycles
- None detected.

## Communities (18 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (37): LegacyReviewRedirect(), LegacyStudentRedirect(), EmptyState(), EmptyStateProps, PageHeader(), PageHeaderProps, StudentDetailFrame(), StudentDetailFrameProps (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (42): AppShell(), navItems, BrandMark(), BrandMarkProps, PgnDropZone(), PgnDropZoneProps, demoGames, demoStudent (+34 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): chess.js, clsx, dexie, dexie-react-hooks, @fontsource/manrope, @fontsource/space-grotesk, lucide-react, dependencies (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (27): clamp(), classifyCpl(), EngineEvaluation, fenTurn(), normalizeScore(), phaseScoreFromAverageCpl(), runDeepEngineReview(), StockfishSession (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (25): BoardPreview(), BoardPreviewProps, expandBoard(), PIECES, MoveList(), MoveListProps, ReviewDetailFrame(), ReviewDetailFrameProps (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (29): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (26): DOM, DOM.Iterable, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (24): archetypeFromMetrics(), buildActionChecklist(), buildHeuristicCriticalMoments(), buildHeuristicPhaseScores(), buildLeaks(), buildSessionAgenda(), buildStrengths(), buildStyleFingerprint() (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.52
Nodes (4): c(), f(), i(), l()

### Community 10 - "Community 10"
Cohesion: 0.43
Nodes (5): App(), registerServiceWorker(), sameOriginPath(), STATIC_URLS, warmOfflineCache()

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (3): CORE_ASSETS, getBuildAssets(), normalizeAssetPath()

## Knowledge Gaps
- **103 isolated node(s):** `name`, `private`, `version`, `license`, `description` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 5` to `Community 2`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `runDeepEngineReview()` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.0907563025210084 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._