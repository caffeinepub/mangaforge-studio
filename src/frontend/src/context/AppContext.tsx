import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

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
  const [showApiKeyModal, setShowApiKeyModal] = useState(
    () => !localStorage.getItem("gemini_api_key"),
  );
  const [apiKey, setApiKeyState] = useState<string | null>(() =>
    localStorage.getItem("gemini_api_key"),
  );

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setApiKeyState(key);
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
