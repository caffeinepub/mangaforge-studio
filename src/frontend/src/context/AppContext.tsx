import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const HARDCODED_API_KEY = "AIzaSyBGApYsIqhLup8bHCd1YmnWmL3zTgI8k9Q";

export type AppTab = "studio" | "characters" | "suggestions";

interface AppContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedProjectId: bigint | null;
  selectedBookId: bigint | null;
  selectedChapterId: bigint | null;
  navigateTo: (
    projectId?: bigint | null,
    bookId?: bigint | null,
    chapterId?: bigint | null,
  ) => void;
  apiKey: string | null;
  setApiKey: (key: string) => void;
  showApiKeyModal: boolean;
  setShowApiKeyModal: (show: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<AppTab>("studio");
  const [selectedProjectId, setSelectedProjectId] = useState<bigint | null>(
    null,
  );
  const [selectedBookId, setSelectedBookId] = useState<bigint | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<bigint | null>(
    null,
  );
  // Always use the hardcoded key; never show the API key modal
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(HARDCODED_API_KEY);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("mangaforge_theme");
    return saved !== "light";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("mangaforge_theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  const setApiKey = useCallback((_key: string) => {
    // Key is hardcoded; ignore external changes
    setApiKeyState(HARDCODED_API_KEY);
  }, []);

  const navigateTo = useCallback(
    (
      projectId?: bigint | null,
      bookId?: bigint | null,
      chapterId?: bigint | null,
    ) => {
      setSelectedProjectId(projectId ?? null);
      setSelectedBookId(bookId ?? null);
      setSelectedChapterId(chapterId ?? null);
      setActiveTab("studio");
    },
    [],
  );

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedProjectId,
        selectedBookId,
        selectedChapterId,
        navigateTo,
        apiKey,
        setApiKey,
        showApiKeyModal,
        setShowApiKeyModal,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
