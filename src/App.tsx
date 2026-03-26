import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DashboardRoute } from './routes/DashboardRoute'
import { IntakeRoute } from './routes/IntakeRoute'
import { ReviewRoute } from './routes/ReviewRoute'
import { StudentRoute } from './routes/StudentRoute'
import { StudentsRoute } from './routes/StudentsRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardRoute />} />
          <Route path="/students" element={<StudentsRoute />} />
          <Route path="/intake" element={<IntakeRoute />} />
          <Route path="/review/:gameId" element={<ReviewRoute />} />
          <Route path="/students/:studentId" element={<StudentRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
