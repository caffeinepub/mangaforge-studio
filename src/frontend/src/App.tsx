import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AlertTriangle, Loader2, RefreshCw, Zap } from "lucide-react";
import Header from "./components/layout/Header";
import LeftSidebar from "./components/layout/LeftSidebar";
import ApiKeyModal from "./components/modals/ApiKeyModal";
import ProfileSetupModal from "./components/modals/ProfileSetupModal";
import BookView from "./components/views/BookView";
import ChapterView from "./components/views/ChapterView";
import CharactersView from "./components/views/CharactersView";
import ProjectView from "./components/views/ProjectView";
import ProjectsDashboard from "./components/views/ProjectsDashboard";
import SuggestionsView from "./components/views/SuggestionsView";
import { AppProvider, useAppContext } from "./context/AppContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.08 0 0) 0%, oklch(0.12 0.005 22) 100%)",
      }}
    >
      <div className="text-center max-w-md px-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Zap
            className="w-10 h-10"
            style={{ color: "oklch(var(--red-brand))" }}
          />
          <h1 className="text-4xl font-display font-bold tracking-widest">
            <span style={{ color: "oklch(var(--red-brand))" }}>MANGA</span>FORGE
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-2 font-display">
          STUDIO
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          Create, organize and enhance your manga with AI-powered tools
        </p>
        <Button
          onClick={login}
          disabled={isLoggingIn}
          className="px-10 py-2.5 text-base"
          style={{ background: "oklch(var(--blue-action))", color: "white" }}
          data-ocid="login.button"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Logging in...
            </>
          ) : (
            "Login to Studio"
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-6">
          Secured by Internet Identity
        </p>
      </div>
      <footer className="absolute bottom-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function StudioContent() {
  const {
    activeTab,
    selectedProjectId,
    selectedBookId,
    selectedChapterId,
    showApiKeyModal,
    setShowApiKeyModal,
    setApiKey,
  } = useAppContext();

  const renderMainContent = () => {
    if (activeTab === "characters") return <CharactersView />;
    if (activeTab === "suggestions") return <SuggestionsView />;

    // Studio tab
    if (selectedChapterId) return <ChapterView />;
    if (selectedBookId) return <BookView />;
    if (selectedProjectId) return <ProjectView />;
    return <ProjectsDashboard />;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 flex overflow-hidden bg-background manga-watermark">
          {renderMainContent()}
        </main>
      </div>
      <footer className="h-8 border-t border-border bg-sidebar flex items-center px-4 justify-between shrink-0">
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} MangaForge Studio
        </span>
        <span className="text-xs text-muted-foreground">
          Built with{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </span>
      </footer>
      {showApiKeyModal && (
        <ApiKeyModal
          open
          onClose={() => setShowApiKeyModal(false)}
          onSave={setApiKey}
        />
      )}
    </div>
  );
}

function AuthenticatedApp() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorError = !actorFetching && !actor;
  const refetch = () => window.location.reload();
  const {
    isLoading: profileLoading,
    isFetched,
    data: profile,
  } = useGetCallerUserProfile();

  const isLoading = actorFetching || (!!actor && profileLoading);
  const showProfileSetup = !isLoading && isFetched && profile === null;

  if (actorError && !actor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm px-6">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
          <h2 className="text-sm font-semibold mb-1">Connection failed</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Could not connect to the studio backend. Check your connection and
            try again.
          </p>
          <Button size="sm" onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-3 h-3 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Loading studio...
          </span>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <StudioContent />
      <ProfileSetupModal open={showProfileSetup} />
    </AppProvider>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Toaster theme="dark" />
      {!identity ? <LoginScreen /> : <AuthenticatedApp />}
    </>
  );
}
