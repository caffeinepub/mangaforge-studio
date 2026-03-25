import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Zap } from "lucide-react";
import { type AppTab, useAppContext } from "../../context/AppContext";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../../hooks/useQueries";

const TABS: { id: AppTab; label: string }[] = [
  { id: "studio", label: "STUDIO" },
  { id: "characters", label: "CHARACTERS" },
  { id: "suggestions", label: "SUGGESTIONS" },
];

export default function Header() {
  const { activeTab, setActiveTab } = useAppContext();
  const { clear, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MF";

  return (
    <header
      className="flex items-center h-12 px-4 border-b border-border bg-sidebar shrink-0"
      style={{ zIndex: 50 }}
    >
      <div className="flex items-center gap-2 mr-8">
        <Zap className="w-5 h-5" style={{ color: "oklch(var(--red-brand))" }} />
        <span
          className="font-display font-bold text-base tracking-widest"
          style={{ color: "oklch(var(--red-brand))" }}
        >
          MANGA<span className="text-foreground">FORGE</span>
        </span>
      </div>

      <nav className="flex items-center gap-1 flex-1">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`nav.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1 text-xs tracking-widest font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: "oklch(var(--red-brand))" }}
              />
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {profile?.name && (
          <span className="text-xs text-muted-foreground">{profile.name}</span>
        )}
        <Avatar className="w-7 h-7">
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        {identity && (
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={handleLogout}
            data-ocid="nav.logout.button"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </header>
  );
}
