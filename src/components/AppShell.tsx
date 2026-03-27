import { startTransition, useEffect, useState } from 'react'
import { CloudOff, Upload, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { ensureSeedData } from '../lib/db'
import { importPath } from '../lib/routes'
import { BrandMark } from './BrandMark'

const navItems = [
  { to: '/', label: 'Today' },
  { to: '/students', label: 'Students' },
  { to: '/import', label: 'Import' },
  { to: '/reviews', label: 'Reviews' },
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
    <div className="mx-auto min-h-screen max-w-[1560px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[1.6rem] border border-line bg-white/60 shadow-[0_30px_80px_-56px_rgba(18,36,24,0.22)] backdrop-blur-sm">
        <header className="sticky top-0 z-30 border-b border-line bg-white/92 px-5 py-4 backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <BrandMark compact />
              <div className="flex flex-wrap gap-2">
                <span className="inline-meta">Coach workspace</span>
                {!isOnline ? <span className="inline-meta"><CloudOff className="h-3.5 w-3.5" /> Offline active</span> : null}
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:items-end">
              <nav className="app-nav flex flex-wrap gap-2" aria-label="Primary">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      isActive
                        ? 'subnav-tab is-active'
                        : 'subnav-tab'
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="app-actions flex flex-wrap gap-3">
                <NavLink className="secondary-button" to="/students/new">
                  <Users className="mr-2 h-4 w-4" />
                  New student
                </NavLink>
                <NavLink className="primary-button" to={importPath()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import PGN
                </NavLink>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-7rem)] bg-transparent px-5 py-6 sm:px-6 sm:py-7">
          {isReady ? (
            <Outlet />
          ) : (
            <div className="page-header">
              <p className="section-label">Loading</p>
              <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-[-0.05em] text-ink sm:text-5xl">
                Building your coaching workspace.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-copy sm:text-base">
                Pulling in saved students, reviews, and offline analysis so the app is ready to use.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
