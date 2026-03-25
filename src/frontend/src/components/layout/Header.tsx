import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, Moon, Search, Settings, Sun, Zap } from "lucide-react";
import { useState } from "react";
import { type AppTab, useAppContext } from "../../context/AppContext";
import { useIsMobile } from "../../hooks/use-mobile";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../../hooks/useQueries";
import SearchModal from "../views/SearchModal";
import SidebarProjectTree from "./SidebarProjectTree";

const TABS: { id: AppTab; label: string }[] = [
  { id: "studio", label: "STUDIO" },
  { id: "characters", label: "CHARACTERS" },
  { id: "suggestions", label: "SUGGESTIONS" },
];

export default function Header() {
  const {
    activeTab,
    setActiveTab,
    darkMode,
    toggleDarkMode,
    setShowApiKeyModal,
  } = useAppContext();
  const { clear, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          type="button"
          className="mr-3 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(true)}
          data-ocid="nav.mobile_menu.button"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-2 mr-8">
        <Zap className="w-5 h-5" style={{ color: "oklch(var(--red-brand))" }} />
        <span
          className="font-display font-bold text-base tracking-widest"
          style={{ color: "oklch(var(--red-brand))" }}
        >
          MANGA<span className="text-foreground">FORGE</span>
        </span>
      </div>

      {/* Desktop tab nav */}
      {!isMobile && (
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
      )}

      {isMobile && <div className="flex-1" />}

      <div className="flex items-center gap-1.5">
        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7"
          onClick={() => setSearchOpen(true)}
          data-ocid="nav.search.button"
          aria-label="Search"
        >
          <Search className="w-3.5 h-3.5" />
        </Button>

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7"
          onClick={toggleDarkMode}
          data-ocid="nav.darkmode.toggle"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </Button>

        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              data-ocid="nav.settings.button"
              aria-label="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem
              onClick={() => setShowApiKeyModal(true)}
              data-ocid="nav.settings.change_apikey"
            >
              <span className="text-xs">Change API Key</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isMobile && profile?.name && (
          <span className="text-xs text-muted-foreground ml-1">
            {profile.name}
          </span>
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

      {/* Mobile navigation sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 flex flex-col bg-sidebar"
          data-ocid="nav.mobile_menu.sheet"
        >
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Zap
                className="w-4 h-4"
                style={{ color: "oklch(var(--red-brand))" }}
              />
              <span
                className="font-display font-bold text-sm tracking-widest"
                style={{ color: "oklch(var(--red-brand))" }}
              >
                MANGA<span className="text-foreground">FORGE</span>
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Tab navigation */}
          <div className="px-2 py-3 border-b border-border">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                data-ocid={`nav.mobile.${tab.id}.tab`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center px-3 py-2.5 rounded-md text-sm tracking-widest font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {activeTab === tab.id && (
                  <span
                    className="w-1 h-1 rounded-full mr-2 shrink-0"
                    style={{ background: "oklch(var(--red-brand))" }}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Project tree */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <SidebarProjectTree onNavigate={() => setMobileMenuOpen(false)} />
          </div>

          {/* Footer */}
          {identity && (
            <div className="px-3 py-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                data-ocid="nav.mobile.logout.button"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
