import type { ComponentType, ReactNode } from "react"

/*
 * Props the shell hands to an app-injected link renderer. The app spreads these onto whatever
 * navigation primitive it uses (e.g. a router `Link`); `ui/` stays unaware of any router.
 */
export type NavLinkRenderProps = {
  className: string
  children: ReactNode
  "aria-current"?: "page" | undefined
  "aria-label"?: string | undefined
  title?: string | undefined
  onClick?: (() => void) | undefined
}

export type RenderNavLink = (props: NavLinkRenderProps) => ReactNode

/*
 * A presentational nav destination. Carries no route knowledge: navigation and active-state are
 * injected by the app via `renderLink`/`active`. When `renderLink` is absent the entry renders as
 * a disabled placeholder.
 */
export type NavItem = {
  readonly id: string
  readonly label: string
  readonly icon: ComponentType<{ size?: number | string }>
  readonly active?: boolean
  readonly renderLink?: RenderNavLink
}

export type NavConfig = {
  /* Shown directly in the bottom bar (cap 4) and at the top of the desktop rail. */
  readonly primary: ReadonlyArray<NavItem>
  /* Behind the "More" sheet on mobile; listed inline lower in the rail on desktop. */
  readonly more: ReadonlyArray<NavItem>
  /* Pinned at the bottom of the desktop rail; the mobile top-bar gear targets it. */
  readonly settings: NavItem
}
