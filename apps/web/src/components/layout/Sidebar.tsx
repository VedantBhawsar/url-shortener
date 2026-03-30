import { NavLink, useNavigate } from "react-router-dom";
import { Link2, BarChart3, Settings, LogOut, ChevronRight, CreditCard } from "lucide-react";
import { useLogout, useMe } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ─── Nav Item ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/*
          NavLink receives `isActive` automatically based on the current URL.
          We use `end` only on exact paths; analytics uses prefix match so
          /dashboard/analytics/:linkId also lights up the Analytics item.
        */}
        <NavLink
          to={to}
          end={to === "/dashboard/links"}
          className={({ isActive }) =>
            cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group border",
              isActive
                ? "bg-sidebar-primary/15 text-sidebar-primary border-sidebar-primary/20"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent border-transparent"
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  "shrink-0 transition-transform group-hover:scale-110",
                  isActive && "text-sidebar-primary"
                )}
              >
                {icon}
              </span>
              <span className="hidden lg:block">{label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto hidden lg:block text-sidebar-primary" />
              )}
            </>
          )}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right" className="lg:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const navigate = useNavigate();
  const { data: meRes } = useMe();
  const logout = useLogout();
  const user = meRes?.data;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate("/login"),
    });
  };

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-14 lg:w-56 shrink-0 px-2 lg:px-3 py-4">
      {/* Logo */}
      <NavLink
        to="/dashboard/links"
        className="flex items-center gap-2.5 px-1 mb-8 group outline-none"
      >
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-md shadow-sidebar-primary/30 shrink-0 group-hover:bg-sidebar-primary/80 transition-colors">
          <Link2 className="w-4 h-4 text-sidebar-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="hidden lg:block text-base font-bold tracking-tight text-sidebar-foreground font-mono">
          snip.ly
        </span>
      </NavLink>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem
          to="/dashboard/links"
          icon={<Link2 className="w-4 h-4" />}
          label="My Links"
        />
        <NavItem
          to="/dashboard/analytics"
          icon={<BarChart3 className="w-4 h-4" />}
          label="Analytics"
        />
        <NavItem
          to="/dashboard/settings"
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
        />
        <NavItem
          to="/dashboard/billing"
          icon={<CreditCard className="w-4 h-4" />}
          label="Billing"
        />
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border pt-3 mt-3 flex items-center gap-2.5">
        <Avatar className="w-7 h-7 shrink-0 ring-1 ring-sidebar-border">
          <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden lg:flex flex-col flex-1 min-w-0">
          <span className="text-xs font-semibold text-sidebar-foreground truncate">
            {user?.name ?? "—"}
          </span>
          <span className="text-[11px] text-sidebar-foreground/50 truncate">
            {user?.email ?? "—"}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Sign out
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}