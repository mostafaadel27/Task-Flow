import Link from "next/link";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, signInWithProvider } from "@/app/auth/actions";

export const metadata = {
  title: "Log in | TaskFlow",
  description: "Log in to your TaskFlow account.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-sm mx-auto space-y-8">
        {/* Logo */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 mb-8" aria-label="TaskFlow home">
            <Layers className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold tracking-tight">TaskFlow</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            No account?{" "}
            <Link href="/register" className="font-medium text-foreground hover:underline">
              Create one
            </Link>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md" role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" action={login}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-required="true"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* OAuth */}
        <div className="flex flex-col gap-2">
          <form action={signInWithProvider}>
            <input type="hidden" name="provider" value="google" />
            <Button type="submit" variant="outline" className="w-full">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
