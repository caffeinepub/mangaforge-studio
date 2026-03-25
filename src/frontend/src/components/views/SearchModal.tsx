import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, FileText, FolderOpen, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import {
  useGetAllProjects,
  useGetBooksForProject,
  useGetChaptersForBook,
  useGetCharactersForProject,
} from "../../hooks/useQueries";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

function SearchResults({
  query,
  onClose,
}: { query: string; onClose: () => void }) {
  const { navigateTo, selectedProjectId } = useAppContext();
  const { data: projects = [] } = useGetAllProjects();
  const { data: characters = [] } =
    useGetCharactersForProject(selectedProjectId);
  const { data: books = [] } = useGetBooksForProject(selectedProjectId);
  // We'd need all book IDs to get all chapters; use first book for simplicity
  const firstBookId = books[0]?.id ?? null;
  const { data: chapters = [] } = useGetChaptersForBook(firstBookId);

  const q = query.toLowerCase();

  const results = useMemo(() => {
    if (!q) return { projects: [], characters: [], chapters: [] };
    return {
      projects: projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      ),
      characters: characters.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.appearanceDescription.toLowerCase().includes(q) ||
          c.powerDescription.toLowerCase().includes(q),
      ),
      chapters: chapters.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.synopsis.toLowerCase().includes(q),
      ),
    };
  }, [q, projects, characters, chapters]);

  const total =
    results.projects.length +
    results.characters.length +
    results.chapters.length;

  if (!q) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Type to search across your manga</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No results for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.projects.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Projects
          </p>
          <div className="space-y-1">
            {results.projects.map((p) => (
              <button
                key={p.id.toString()}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                onClick={() => {
                  navigateTo(p.id);
                  onClose();
                }}
                data-ocid="search.project.item"
              >
                <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {p.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {results.characters.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Characters
          </p>
          <div className="space-y-1">
            {results.characters.map((c) => (
              <button
                key={c.id.toString()}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                onClick={() => onClose()}
                data-ocid="search.character.item"
              >
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.powerDescription && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {c.powerDescription}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {results.chapters.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Chapters
          </p>
          <div className="space-y-1">
            {results.chapters.map((c) => (
              <button
                key={c.id.toString()}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                onClick={() => {
                  if (selectedProjectId && firstBookId) {
                    navigateTo(selectedProjectId, firstBookId, c.id);
                  }
                  onClose();
                }}
                data-ocid="search.chapter.item"
              >
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  {c.synopsis && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {c.synopsis}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {books.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Books
          </p>
          <div className="space-y-1">
            {books
              .filter(
                (b) =>
                  b.title.toLowerCase().includes(q) ||
                  b.synopsis.toLowerCase().includes(q),
              )
              .map((b) => (
                <button
                  key={b.id.toString()}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                  onClick={() => {
                    if (selectedProjectId) {
                      navigateTo(selectedProjectId, b.id);
                    }
                    onClose();
                  }}
                  data-ocid="search.book.item"
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{b.title}</p>
                    {b.synopsis && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {b.synopsis}
                      </p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setQuery("");
          onClose();
        }
      }}
    >
      <DialogContent
        className="bg-card border-border sm:max-w-lg"
        data-ocid="search.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            data-ocid="search.search_input"
            placeholder="Search projects, characters, chapters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-input border-border"
            autoFocus
          />
          <ScrollArea className="max-h-80">
            <SearchResults
              query={query}
              onClose={() => {
                setQuery("");
                onClose();
              }}
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
