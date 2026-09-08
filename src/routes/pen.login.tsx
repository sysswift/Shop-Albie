import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShopAlbieLogo } from "@/components/shop-albie-logo";
import { signInAdmin, signOutAdmin } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/api/admin-access.functions";
import { ADMIN_PORTAL_PATH } from "@/lib/admin-portal";

export const Route = createFileRoute("/pen/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Shop Albie" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await signInAdmin(email, password);
      if (!session) {
        setError("Login failed — no session returned.");
        return;
      }
      // Brief pause so session is written to localStorage before the access check.
      await new Promise((r) => setTimeout(r, 100));
      // Confirm this account is an allowed admin (server checks ADMIN_EMAILS).
      try {
        await checkAdminAccess();
      } catch {
        await signOutAdmin();
        setError("This account is not allowed to access the admin portal.");
        return;
      }
      await navigate({ to: ADMIN_PORTAL_PATH });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background">
        <ShopAlbieLogo size="xl" linked={false} inverted />
        <div>
          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-3">Studio Console</p>
          <h1 className="text-5xl font-semibold tracking-tight leading-[0.95]">
            Catalog<br />management.
          </h1>
          <p className="mt-6 text-background/60 max-w-sm text-sm leading-relaxed">
            Manage products, categories, and customer orders from one place.
          </p>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-background/30">
          Shop Albie — Admin Portal
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex flex-col justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm mx-auto">
          <ShopAlbieLogo size="lg" className="mb-12 lg:hidden" />

          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-2">Sign in</p>
          <h2 className="text-3xl font-semibold tracking-tight mb-10">Admin access</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="admin@shopalbie.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-widest font-semibold hover:bg-accent disabled:opacity-60 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in to console"}
            </button>
          </form>

          <p className="mt-10 text-[10px] font-mono uppercase text-muted-foreground tracking-widest text-center">
            <Link to="/" className="hover:text-accent transition-colors">← Return to storefront</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
