import type { IconName } from '../components/Icon'

export interface NavItem {
  icon: IconName
  label: string
  path: string
  /** Built pages; the rest render the "not available yet" page. */
  ready?: boolean
  /** What an unbuilt module will do, shown on its "not available yet" page. */
  summary?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}
