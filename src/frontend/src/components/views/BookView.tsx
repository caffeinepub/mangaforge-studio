import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  Circle,
  FileText,
  LayoutGrid,
  Plus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import {
  useGetChaptersForBook,
  useGetPanelsForChapter,
} from "../../hooks/useQueries";
import NewChapterModal from "../modals/NewChapterModal";
import { LAYOUTS } from "../panels/PanelLayoutPicker";

function PanelThumbnail({ layoutId }: { layoutId: number }) {
  const layout = LAYOUTS.find((l) => l.id === layoutId);
  if (!layout) return null;
  return (
    <svg
      viewBox="0 0 60 80"
      width="40"
      height="54"
      className="text-foreground/50 shrink-0"
    >
      <title>{layout.name}</title>
      {layout.elements}
    </svg>
  );
}

function ChapterStoryboardSection({
  chapter,
  chapterIndex,
  onClick,
}: {
  chapter: any;
  chapterIndex: number;
  onClick: () => void;
}) {
  const { data: panels = [] } = useGetPanelsForChapter(chapter.id);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-7 h-7 rounded flex items-center justify-center shrink-0"
          style={{ background: "oklch(var(--blue-action) / 0.15)" }}
        >
          <span
            className="text-xs font-bold"
            style={{ color: "oklch(var(--blue-action))" }}
          >
            {chapterIndex + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="text-sm font-semibold hover:underline text-left"
          data-ocid={`storyboard.chapter.item.${chapterIndex + 1}`}
        >
          {chapter.title}
        </button>
        <Badge
          variant={chapter.hasCover ? "default" : "secondary"}
          className="text-xs"
          style={
            chapter.hasCover
              ? {
                  background: "oklch(0.35 0.10 140)",
                  color: "oklch(0.9 0.05 140)",
                }
              : {}
          }
        >
          {chapter.hasCover ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" /> Cover Done
            </>
          ) : (
            <>
              <Circle className="w-3 h-3 mr-1" /> Needs Cover
            </>
          )}
        </Badge>
      </div>

      {panels.length === 0 ? (
        <div className="ml-10 text-xs text-muted-foreground italic">
          No panels yet
        </div>
      ) : (
        <div className="ml-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {panels.map((panel, pIdx) => (
            <div
              key={panel.id.toString()}
              className="bg-card border border-border rounded-lg p-2 space-y-1.5"
              data-ocid={`storyboard.panel.item.${pIdx + 1}`}
            >
              <div className="flex items-center gap-1.5">
                <PanelThumbnail layoutId={Number(panel.layoutId)} />
                <span className="text-xs font-bold text-muted-foreground">
                  {pIdx + 1}
                </span>
              </div>
              {panel.description && (
                <p className="text-xs text-muted-foreground line-clamp-3 leading-tight">
                  {panel.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StoryboardOverlay({
  bookId,
  onClose,
}: {
  bookId: bigint;
  onClose: () => void;
}) {
  const { selectedProjectId, navigateTo } = useAppContext();
  const { data: chapters = [] } = useGetChaptersForBook(bookId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
        data-ocid="storyboard.panel"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <LayoutGrid
              className="w-5 h-5"
              style={{ color: "oklch(var(--red-brand))" }}
            />
            <h2 className="text-lg font-display font-bold">Storyboard View</h2>
            <span className="text-sm text-muted-foreground">
              {chapters.length} chapters
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-ocid="storyboard.close_button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-6xl mx-auto">
            {chapters.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="storyboard.empty_state"
              >
                <FileText className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm">No chapters yet</p>
              </div>
            ) : (
              chapters.map((ch, idx) => (
                <ChapterStoryboardSection
                  key={ch.id.toString()}
                  chapter={ch}
                  chapterIndex={idx}
                  onClick={() => {
                    if (selectedProjectId) {
                      navigateTo(selectedProjectId, bookId, ch.id);
                    }
                    onClose();
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}

export default function BookView() {
  const { selectedBookId, selectedProjectId, navigateTo } = useAppContext();
  const { data: chapters = [], isLoading } =
    useGetChaptersForBook(selectedBookId);
  const [showNew, setShowNew] = useState(false);
  const [showStoryboard, setShowStoryboard] = useState(false);

  if (!selectedBookId) return null;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Chapters</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Each chapter needs a cover before you can add panels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStoryboard(true)}
              data-ocid="book.storyboard.button"
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              Storyboard
            </Button>
            <Button
              data-ocid="book.new_chapter.button"
              onClick={() => setShowNew(true)}
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> New Chapter
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {["sk-1", "sk-2", "sk-3"].map((k) => (
              <div
                key={k}
                className="h-20 bg-card rounded-lg border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && chapters.length === 0 && (
          <div
            className="text-center py-16"
            data-ocid="book.chapters.empty_state"
          >
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">No chapters yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Add your first chapter to this book
            </p>
            <Button
              onClick={() => setShowNew(true)}
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
              data-ocid="book.empty.new_chapter.button"
            >
              <Plus className="w-4 h-4 mr-2" /> Create First Chapter
            </Button>
          </div>
        )}

        {!isLoading && chapters.length > 0 && (
          <div className="space-y-3">
            {chapters.map((ch, idx) => (
              <motion.div
                key={ch.id.toString()}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                data-ocid={`book.chapter.item.${idx + 1}`}
              >
                <Card
                  className="bg-card border-border hover:border-muted-foreground cursor-pointer transition-all"
                  onClick={() =>
                    navigateTo(selectedProjectId, selectedBookId, ch.id)
                  }
                >
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center"
                          style={{ background: "oklch(var(--muted))" }}
                        >
                          <span className="text-xs font-bold text-muted-foreground">
                            {idx + 1}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">
                            {ch.title}
                          </CardTitle>
                          {ch.synopsis && (
                            <CardDescription className="text-xs line-clamp-1">
                              {ch.synopsis}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={ch.hasCover ? "default" : "secondary"}
                        className="text-xs"
                        style={
                          ch.hasCover
                            ? {
                                background: "oklch(0.35 0.10 140)",
                                color: "oklch(0.9 0.05 140)",
                              }
                            : {}
                        }
                      >
                        {ch.hasCover ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" /> Cover Done
                          </>
                        ) : (
                          <>
                            <Circle className="w-3 h-3 mr-1" /> Needs Cover
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {showNew && selectedBookId && (
        <NewChapterModal
          bookId={selectedBookId}
          open
          onClose={() => setShowNew(false)}
        />
      )}
      {showStoryboard && (
        <StoryboardOverlay
          bookId={selectedBookId}
          onClose={() => setShowStoryboard(false)}
        />
      )}
    </div>
  );
}
