import type { IconName } from '../components/Icon'

export interface NavItem {
  icon: IconName
  label: string
  path: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}
