# Graph Report - .  (2026-04-16)

## Corpus Check
- 66 files · ~32,791 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 173 nodes · 218 edges · 35 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]

## God Nodes (most connected - your core abstractions)
1. `buildInstantReport()` - 14 edges
2. `nowIso()` - 8 edges
3. `upsertImportedGame()` - 8 edges
4. `buildStoredStudent()` - 7 edges
5. `deriveStyleMetrics()` - 7 edges
6. `runDeepEngineReview()` - 7 edges
7. `parseGame()` - 6 edges
8. `handleSave()` - 5 edges
9. `StockfishSession` - 5 edges
10. `switchToNewMode()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `deriveStyleMetrics()` --calls--> `materialEdgeForSide()`  [INFERRED]
  src/lib/chess/heuristics.ts → src/lib/chess/pgn.ts
- `handleSubmit()` --calls--> `upsertImportedGame()`  [INFERRED]
  src/routes/IntakeRoute.tsx → src/lib/db.ts
- `handleSave()` --calls--> `updateStudentProfile()`  [INFERRED]
  src/routes/StudentFormRoute.tsx → src/lib/db.ts
- `handleSave()` --calls--> `createStudentProfile()`  [INFERRED]
  src/routes/StudentFormRoute.tsx → src/lib/db.ts
- `handleDeepReview()` --calls--> `runDeepEngineReview()`  [INFERRED]
  src/routes/ReviewRoute.tsx → src/lib/chess/engine.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (17): archetypeFromMetrics(), buildActionChecklist(), buildHeuristicCriticalMoments(), buildHeuristicPhaseScores(), buildLeaks(), buildSessionAgenda(), buildStrengths(), buildStyleFingerprint() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (19): archiveStudentProfile(), buildInstantAnalysis(), buildStoredGame(), buildStoredStudent(), createStudentProfile(), DeepGameDatabase, deleteStudentProfile(), ensureSeedData() (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (11): clamp(), classifyCpl(), fenTurn(), normalizeScore(), phaseScoreFromAverageCpl(), runDeepEngineReview(), StockfishSession, c() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (10): ReviewDetailFrame(), reviewInsightsPath(), reviewPlanPath(), reviewReplayPath(), studentGamesPath(), studentOverviewPath(), studentProgressPath(), StudentDetailFrame() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (2): StudentGamesRoute(), useStudentRecord()

### Community 5 - "Community 5"
Cohesion: 0.36
Nodes (7): blankFocusStatement(), blankGoalsText(), handleSubmit(), loadDemo(), normalizeGoals(), switchToExistingMode(), switchToNewMode()

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (7): derivePhase(), inferCoachedSide(), materialEdgeForSide(), parseGame(), queensPresent(), resultForSide(), totalMaterial()

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (3): saveDeepAnalysis(), buildDeepReport(), handleDeepReview()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (2): getBuildAssets(), normalizeAssetPath()

### Community 9 - "Community 9"
Cohesion: 0.83
Nodes (3): buildReportMarkdown(), downloadMarkdownReport(), section()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (2): sameOriginPath(), warmOfflineCache()

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (2): BoardPreview(), expandBoard()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (2): summarizeStudent(), topLabels()

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 16`** (2 nodes): `BrandMark()`, `BrandMark.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `MetricCard()`, `MetricCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `PgnDropZone()`, `PgnDropZone.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `SubnavTabs.tsx`, `SubnavTabs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `SectionCard()`, `SectionCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `EmptyState()`, `EmptyState.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `ScoreMeter()`, `ScoreMeter.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `StudentProgressRoute.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `DashboardRoute.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `ReviewPlanRoute.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `StudentRoute.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `ReviewsRoute.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `MoveList.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `PageHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `coaching.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `seeds.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `buildInstantReport()` connect `Community 0` to `Community 1`, `Community 7`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `handleDeepReview()` connect `Community 7` to `Community 2`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `upsertImportedGame()` connect `Community 1` to `Community 0`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `buildInstantReport()` (e.g. with `buildInstantAnalysis()` and `upsertImportedGame()`) actually correct?**
  _`buildInstantReport()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `upsertImportedGame()` (e.g. with `handleSubmit()` and `parseGame()`) actually correct?**
  _`upsertImportedGame()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `deriveStyleMetrics()` (e.g. with `materialEdgeForSide()` and `buildInstantReport()`) actually correct?**
  _`deriveStyleMetrics()` has 2 INFERRED edges - model-reasoned connections that need verification._