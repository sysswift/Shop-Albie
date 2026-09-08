/** Hidden admin portal base path — not linked from the public storefront. */
export const ADMIN_PORTAL_PATH = "/pen" as const;

export type AdminPortalPath = typeof ADMIN_PORTAL_PATH;
