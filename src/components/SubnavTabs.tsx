import { NavLink } from 'react-router-dom'

type SubnavTab = Readonly<{
  to: string
  label: string
}>

type SubnavTabsProps = Readonly<{
  tabs: SubnavTab[]
}>

export function SubnavTabs({ tabs }: SubnavTabsProps) {
  return (
    <nav className="subnav-tabs" aria-label="Section navigation">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => (isActive ? 'subnav-tab is-active' : 'subnav-tab')}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
