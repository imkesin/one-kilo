import { Link, type LinkProps, useMatchRoute } from "@tanstack/react-router"
import { type Destination, destinations } from "./destinations"
import type { NavConfig, NavItem, RenderNavLink } from "./types"

/*
 * Binds the router to the (router-agnostic) shell: produces the `renderLink` the shell calls and
 * the `active` flag it styles from. This is the single place the app's routing knowledge meets the
 * shell's presentation.
 */
function navLink(to: NonNullable<LinkProps["to"]>): RenderNavLink {
  return ({ children, ...rest }) => <Link to={to} {...rest}>{children}</Link>
}

export function useAppNav(): NavConfig {
  const matchRoute = useMatchRoute()

  const toNavItem = (destination: Destination): NavItem => {
    if (!destination.to) {
      return { id: destination.id, label: destination.label, icon: destination.icon }
    }
    return {
      id: destination.id,
      label: destination.label,
      icon: destination.icon,
      active: Boolean(matchRoute({ to: destination.to, fuzzy: true })),
      renderLink: navLink(destination.to)
    }
  }

  return {
    primary: destinations.primary.map(toNavItem),
    more: destinations.more.map(toNavItem),
    settings: toNavItem(destinations.settings)
  }
}
