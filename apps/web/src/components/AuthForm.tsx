import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2, Loader2, AlertCircle } from "lucide-react";

// ─── Shared Field ─────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function Field({ id, label, type = "text", placeholder, value, onChange, disabled }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-10"
      />
    </div>
  );
}

// ─── Logo Mark ────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5 mb-8 justify-center">
      <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
        <Link2 className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-xl font-bold tracking-tight text-white font-mono">snip.ly</span>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

interface LoginFormProps {
  onSwitch: () => void;
}

export function LoginForm({ onSwitch }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <AuthLayout>
      <Card className="bg-zinc-900/80 border-zinc-800 shadow-2xl backdrop-blur-sm">
        <CardHeader className="pb-4">
          <LogoMark />
          <CardTitle className="text-2xl font-bold text-white text-center tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-zinc-400 text-center text-sm">
            Sign in to manage your short links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {login.error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-800/60 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {(login.error as Error).message}
                </AlertDescription>
              </Alert>
            )}
            <Field id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} disabled={login.isPending} />
            <Field id="password" label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} disabled={login.isPending} />
            <Button
              type="submit"
              disabled={login.isPending || !email || !password}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold h-10 mt-2 shadow-lg shadow-indigo-500/20 transition-all duration-150"
            >
              {login.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-zinc-500">
            No account?{" "}
            <button onClick={onSwitch} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create one
            </button>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────

interface RegisterFormProps {
  onSwitch: () => void;
  onSuccess: () => void;
}

export function RegisterForm({ onSwitch, onSuccess }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ name, email, password }, { onSuccess });
  };

  return (
    <AuthLayout>
      <Card className="bg-zinc-900/80 border-zinc-800 shadow-2xl backdrop-blur-sm">
        <CardHeader className="pb-4">
          <LogoMark />
          <CardTitle className="text-2xl font-bold text-white text-center tracking-tight">
            Create account
          </CardTitle>
          <CardDescription className="text-zinc-400 text-center text-sm">
            Start shortening links in seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {register.error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-800/60 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {(register.error as Error).message}
                </AlertDescription>
              </Alert>
            )}
            <Field id="name" label="Full name" placeholder="John Doe" value={name} onChange={setName} disabled={register.isPending} />
            <Field id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} disabled={register.isPending} />
            <Field id="password" label="Password" type="password" placeholder="min 8 characters" value={password} onChange={setPassword} disabled={register.isPending} />
            <Button
              type="submit"
              disabled={register.isPending || !name || !email || !password}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold h-10 mt-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              {register.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {register.isPending ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-zinc-500">
            Have an account?{" "}
            <button onClick={onSwitch} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </button>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

// ─── Layout Wrapper ───────────────────────────────────────────────────────────

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-sm relative z-10">{children}</div>
    </div>
  );
}