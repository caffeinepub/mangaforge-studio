import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Calendar, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import {
  useGetBooksForProject,
  useGetChaptersForBook,
} from "../../hooks/useQueries";
import NewBookModal from "../modals/NewBookModal";

const PRESET_TAGS = [
  "Action",
  "Romance",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Comedy",
  "Drama",
  "Mystery",
  "Adventure",
  "Slice-of-Life",
];

const TAG_COLORS: Record<string, string> = {
  Action: "oklch(0.5 0.2 28)",
  Romance: "oklch(0.5 0.18 355)",
  Fantasy: "oklch(0.45 0.15 290)",
  "Sci-Fi": "oklch(0.45 0.15 210)",
  Horror: "oklch(0.35 0.12 22)",
  Comedy: "oklch(0.55 0.18 85)",
  Drama: "oklch(0.45 0.10 250)",
  Mystery: "oklch(0.4 0.12 270)",
  Adventure: "oklch(0.5 0.18 150)",
  "Slice-of-Life": "oklch(0.5 0.14 180)",
};

const STATUS_CONFIG = {
  planning: { label: "Planning", color: "oklch(0.5 0.05 250)" },
  in_progress: { label: "In Progress", color: "oklch(0.5 0.15 220)" },
  complete: { label: "Complete", color: "oklch(0.5 0.15 145)" },
};

type ProjectStatus = keyof typeof STATUS_CONFIG;

function useProjectMeta(projectId: bigint | null) {
  const key = projectId?.toString() ?? "";
  const getTags = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(`tags_project_${key}`) ?? "[]");
    } catch {
      return [];
    }
  };
  const setTags = (tags: string[]) => {
    localStorage.setItem(`tags_project_${key}`, JSON.stringify(tags));
  };
  const getStatus = (): ProjectStatus => {
    return (
      (localStorage.getItem(`status_project_${key}`) as ProjectStatus) ??
      "planning"
    );
  };
  const setStatus = (s: ProjectStatus) => {
    localStorage.setItem(`status_project_${key}`, s);
  };
  return { getTags, setTags, getStatus, setStatus };
}

function BookArcSection({
  book,
  bookIndex,
  onNavigate,
}: {
  book: any;
  bookIndex: number;
  onNavigate: (bookId: bigint, chapterId?: bigint) => void;
}) {
  const { data: chapters = [] } = useGetChaptersForBook(book.id);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="px-3 py-1.5 rounded bg-card border border-border text-xs font-semibold hover:border-muted-foreground transition-colors text-left"
        onClick={() => onNavigate(book.id)}
        data-ocid={`project.storyarc.book.item.${bookIndex + 1}`}
      >
        <span style={{ color: "oklch(var(--blue-action))" }}>
          Vol.{bookIndex + 1}
        </span>{" "}
        {book.title}
      </button>
      {chapters.length > 0 && (
        <div className="flex flex-col gap-1 pl-3 border-l-2 border-border">
          {chapters.map((ch: any, cIdx: number) => (
            <button
              key={ch.id.toString()}
              type="button"
              className="px-2.5 py-1 rounded bg-muted/50 border border-border text-xs hover:bg-muted hover:border-muted-foreground transition-colors text-left max-w-40 truncate"
              onClick={() => onNavigate(book.id, ch.id)}
              data-ocid={`project.storyarc.chapter.item.${cIdx + 1}`}
            >
              Ch.{cIdx + 1} {ch.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StoryArcTimeline({ projectId }: { projectId: bigint }) {
  const { data: books = [] } = useGetBooksForProject(projectId);
  const { navigateTo } = useAppContext();

  if (books.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-display font-bold mb-4">
        Story Arc Timeline
      </h2>
      <div className="overflow-x-auto pb-3">
        <div className="flex gap-6 min-w-max">
          {books.map((book, bIdx) => (
            <BookArcSection
              key={book.id.toString()}
              book={book}
              bookIndex={bIdx}
              onNavigate={(bookId, chapterId) =>
                navigateTo(projectId, bookId, chapterId)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectView() {
  const { selectedProjectId, navigateTo } = useAppContext();
  const { data: books = [], isLoading } =
    useGetBooksForProject(selectedProjectId);
  const [showNew, setShowNew] = useState(false);
  const { getTags, setTags, getStatus, setStatus } =
    useProjectMeta(selectedProjectId);
  const [tags, setTagsState] = useState<string[]>(getTags);
  const [status, setStatusState] = useState<ProjectStatus>(getStatus);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (tag: string) => {
    if (tags.includes(tag)) return;
    const next = [...tags, tag];
    setTagsState(next);
    setTags(next);
  };

  const handleRemoveTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTagsState(next);
    setTags(next);
  };

  const handleStatusChange = (val: string) => {
    setStatusState(val as ProjectStatus);
    setStatus(val as ProjectStatus);
  };

  if (!selectedProjectId) return null;

  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-bold">Books</h1>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger
                  className="h-6 w-auto text-xs border-0 px-2 rounded-full"
                  style={{ background: `${cfg.color}33`, color: cfg.color }}
                  data-ocid="project.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize your manga into volumes and books
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
                  style={
                    TAG_COLORS[tag]
                      ? { background: TAG_COLORS[tag] }
                      : { background: "oklch(0.45 0.1 250)" }
                  }
                  data-ocid="project.tag.item"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-70 hover:opacity-100"
                    data-ocid="project.tag.delete_button"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <Select
                value={tagInput}
                onValueChange={(v) => {
                  setTagInput("");
                  handleAddTag(v);
                }}
              >
                <SelectTrigger
                  className="h-6 w-auto text-xs px-2 rounded-full border-dashed"
                  data-ocid="project.tag.select"
                >
                  <span>+ Tag</span>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {PRESET_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            data-ocid="project.new_book.button"
            onClick={() => setShowNew(true)}
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            <Plus className="w-4 h-4 mr-2" /> New Book
          </Button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-3 gap-4">
            {["sk-1", "sk-2", "sk-3"].map((k) => (
              <div
                key={k}
                className="h-40 bg-card rounded-lg border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && books.length === 0 && (
          <div
            className="text-center py-16"
            data-ocid="project.books.empty_state"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">No books yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Add your first book to this project
            </p>
            <Button
              onClick={() => setShowNew(true)}
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
              data-ocid="project.empty.new_book.button"
            >
              <Plus className="w-4 h-4 mr-2" /> Create First Book
            </Button>
          </div>
        )}

        {!isLoading && books.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book, idx) => (
              <motion.div
                key={book.id.toString()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                data-ocid={`project.book.item.${idx + 1}`}
              >
                <Card
                  className="bg-card border-border hover:border-muted-foreground cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => navigateTo(selectedProjectId, book.id)}
                >
                  <CardHeader className="pb-2">
                    <div
                      className="w-8 h-8 rounded mb-2 flex items-center justify-center"
                      style={{ background: "oklch(var(--blue-action) / 0.15)" }}
                    >
                      <BookOpen
                        className="w-4 h-4"
                        style={{ color: "oklch(var(--blue-action))" }}
                      />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      {book.title}
                    </CardTitle>
                    {book.synopsis && (
                      <CardDescription className="text-xs line-clamp-2">
                        {book.synopsis}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(
                          Number(book.createdAt / BigInt(1000000)),
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <StoryArcTimeline projectId={selectedProjectId} />
      </div>
      {showNew && selectedProjectId && (
        <NewBookModal
          projectId={selectedProjectId}
          open
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}
