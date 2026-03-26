import { startTransition, useEffect, useState } from 'react'
import { CloudOff, ShieldCheck, Upload } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { ensureSeedData } from '../lib/db'
import { BrandMark } from './BrandMark'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/intake', label: 'Upload A Game' },
  { to: '/students/demo-samaritan963', label: 'Sample Progress' },
]

export function AppShell() {
  const [isReady, setIsReady] = useState(false)
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine)

  useEffect(() => {
    let isMounted = true

    ensureSeedData().finally(() => {
      if (!isMounted) {
        return
      }

      startTransition(() => {
        setIsReady(true)
      })
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    function onOnline() {
      setIsOnline(true)
    }

    function onOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="panel overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 px-5 py-4 backdrop-blur-md sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <BrandMark />
              <div className="metric-chip">
                <ShieldCheck className="h-3.5 w-3.5" />
                Clear, personal chess coaching
              </div>
              {!isOnline ? (
                <div className="metric-chip">
                  <CloudOff className="h-3.5 w-3.5" />
                  Offline mode active
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <nav className="app-nav flex flex-wrap items-center gap-2 text-sm font-semibold text-copy">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'rounded-full px-4 py-2 transition-colors duration-200',
                        isActive
                          ? 'bg-mint-soft text-forest'
                          : 'hover:bg-ivory-deep hover:text-ink',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="app-actions flex flex-wrap gap-3">
                <NavLink className="brand-button" to="/intake">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload A Game
                </NavLink>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-8rem)] bg-transparent">
          {isReady ? (
            <Outlet />
          ) : (
            <div className="px-5 py-8 sm:px-7 sm:py-10">
              <div className="soft-panel p-8">
                <p className="section-label">Loading</p>
                <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-[-0.05em] text-ink sm:text-6xl">
                  Getting your coaching space ready.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-copy sm:text-lg">
                  Bringing in your saved games, reports, and progress notes.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
