import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ShopAlbieLogo } from "@/components/shop-albie-logo";
import { ADMIN_PORTAL_PATH } from "@/lib/admin-portal";
import { getAdminSession, signOutAdmin, onAuthStateChange } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/api/admin-access.functions";

const nav = [
  { to: ADMIN_PORTAL_PATH, label: "Overview", icon: "◈", exact: true },
  { to: `${ADMIN_PORTAL_PATH}/products`, label: "Products", icon: "◻" },
  { to: `${ADMIN_PORTAL_PATH}/categories`, label: "Categories", icon: "◈" },
  { to: `${ADMIN_PORTAL_PATH}/orders`, label: "Orders", icon: "◎" },
] as const;

export function AdminShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verify() {
      const session = await getAdminSession();
      if (!mounted) return;
      if (!session) {
        setAuthed(false);
        setChecking(false);
        navigate({ to: `${ADMIN_PORTAL_PATH}/login` });
        return;
      }
      // Session exists — confirm the email is on the allowlist (server-side).
      try {
        await checkAdminAccess();
        if (!mounted) return;
        setAuthed(true);
      } catch {
        if (!mounted) return;
        setAuthed(false);
        await signOutAdmin();
        navigate({ to: `${ADMIN_PORTAL_PATH}/login` });
      } finally {
        if (mounted) setChecking(false);
      }
    }

    void verify();

    const { data: listener } = onAuthStateChange((loggedIn) => {
      if (!mounted) return;
      if (!loggedIn) {
        setAuthed(false);
        setChecking(false);
        navigate({ to: `${ADMIN_PORTAL_PATH}/login` });
      }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [navigate]);

  /* close drawer on route change */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <ShopAlbieLogo size="lg" linked={false} className="mb-6" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground animate-pulse">
          Verifying access…
        </p>
      </div>
    );
  }

  if (!authed) return null;

  async function handleSignOut() {
    await signOutAdmin();
    navigate({ to: `${ADMIN_PORTAL_PATH}/login` });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* ── Mobile top bar ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-40">
        <ShopAlbieLogo size="md" to={ADMIN_PORTAL_PATH} />
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono uppercase text-accent tracking-widest">Admin</span>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 flex flex-col gap-[5px] items-center justify-center border border-border"
            aria-label="Menu"
          >
            <span className={`block w-5 h-px bg-foreground transition-transform ${menuOpen ? "rotate-45 translate-y-[6px]" : ""}`} />
            <span className={`block w-5 h-px bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-px bg-foreground transition-transform ${menuOpen ? "-rotate-45 -translate-y-[6px]" : ""}`} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`md:hidden fixed top-0 right-0 h-full w-64 bg-background border-l border-border z-50 flex flex-col p-6 gap-8 transition-transform duration-200 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-accent tracking-widest">Menu</span>
          <button onClick={() => setMenuOpen(false)} className="text-2xl leading-none">×</button>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-medium transition-colors ${active ? "bg-foreground text-background" : "hover:bg-surface"}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <Link to="/" className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest hover:text-accent transition-colors">
            ← View Storefront
          </Link>
          <button
            onClick={handleSignOut}
            className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest hover:text-destructive transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 min-h-screen border-r border-border p-6 flex-col gap-10">
        <div>
          <ShopAlbieLogo size="lg" to={ADMIN_PORTAL_PATH} linked={false} />
          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mt-3">Admin</p>
        </div>

        <nav className="flex flex-col gap-1 text-xs uppercase tracking-widest font-medium">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${active ? "bg-foreground text-background" : "hover:bg-surface"}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 mt-auto">
          <Link to="/" className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest hover:text-accent transition-colors">
            ← View Storefront
          </Link>
          <button
            onClick={handleSignOut}
            className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest hover:text-destructive transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children ?? <Outlet />}</main>
    </div>
  );
}
