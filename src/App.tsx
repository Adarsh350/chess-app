import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DashboardRoute } from './routes/DashboardRoute'
import { IntakeRoute } from './routes/IntakeRoute'
import { ReviewInsightsRoute } from './routes/ReviewInsightsRoute'
import { ReviewPlanRoute } from './routes/ReviewPlanRoute'
import { ReviewRoute } from './routes/ReviewRoute'
import { ReviewsRoute } from './routes/ReviewsRoute'
import { StudentFormRoute } from './routes/StudentFormRoute'
import { StudentGamesRoute } from './routes/StudentGamesRoute'
import { StudentProgressRoute } from './routes/StudentProgressRoute'
import { StudentRoute } from './routes/StudentRoute'
import { StudentsRoute } from './routes/StudentsRoute'
import { reviewReplayPath, studentOverviewPath } from './lib/routes'

function LegacyStudentRedirect() {
  const { studentId } = useParams()
  if (!studentId) {
    return <Navigate to="/students" replace />
  }
  return <Navigate to={studentOverviewPath(studentId)} replace />
}

function LegacyReviewRedirect() {
  const { gameId } = useParams()
  if (!gameId) {
    return <Navigate to="/reviews" replace />
  }
  return <Navigate to={reviewReplayPath(gameId)} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardRoute />} />
          <Route path="/students" element={<StudentsRoute />} />
          <Route path="/students/new" element={<StudentFormRoute mode="create" />} />
          <Route path="/students/:studentId/edit" element={<StudentFormRoute mode="edit" />} />
          <Route path="/students/:studentId/overview" element={<StudentRoute />} />
          <Route path="/students/:studentId/games" element={<StudentGamesRoute />} />
          <Route path="/students/:studentId/progress" element={<StudentProgressRoute />} />
          <Route path="/import" element={<IntakeRoute />} />
          <Route path="/reviews" element={<ReviewsRoute />} />
          <Route path="/reviews/:gameId/replay" element={<ReviewRoute />} />
          <Route path="/reviews/:gameId/insights" element={<ReviewInsightsRoute />} />
          <Route path="/reviews/:gameId/plan" element={<ReviewPlanRoute />} />

          <Route path="/intake" element={<Navigate to="/import" replace />} />
          <Route path="/review/:gameId" element={<LegacyReviewRedirect />} />
          <Route path="/students/:studentId" element={<LegacyStudentRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
