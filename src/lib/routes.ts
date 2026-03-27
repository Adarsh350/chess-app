export function studentOverviewPath(studentId: string) {
  return `/students/${studentId}/overview`
}

export function studentGamesPath(studentId: string) {
  return `/students/${studentId}/games`
}

export function studentProgressPath(studentId: string) {
  return `/students/${studentId}/progress`
}

export function studentEditPath(studentId: string) {
  return `/students/${studentId}/edit`
}

export function importPath(studentId?: string) {
  return studentId ? `/import?studentId=${studentId}` : '/import'
}

export function reviewReplayPath(gameId: string, ply?: number) {
  return ply ? `/reviews/${gameId}/replay?ply=${ply}` : `/reviews/${gameId}/replay`
}

export function reviewInsightsPath(gameId: string) {
  return `/reviews/${gameId}/insights`
}

export function reviewPlanPath(gameId: string) {
  return `/reviews/${gameId}/plan`
}
