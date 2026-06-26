export const ROUTES = {
  items: '/items',
  settings: '/settings',
} as const;

export const NAV_ITEMS = [
  { label: 'Items', path: ROUTES.items },
  { label: 'Settings', path: ROUTES.settings },
] as const;
