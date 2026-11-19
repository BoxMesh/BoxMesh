import type { IconName } from '../components/Icon'

export interface NavItem {
  icon: IconName
  label: string
  path: string
}

export interface NavGroup {
  title: string
  /** Shown to the System account only; App.tsx keeps its routes out of reach too. */
  admin?: boolean
  items: NavItem[]
}
