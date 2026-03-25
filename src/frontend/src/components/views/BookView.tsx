import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Circle, FileText, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useGetChaptersForBook } from "../../hooks/useQueries";
import NewChapterModal from "../modals/NewChapterModal";

export default function BookView() {
  const { selectedBookId, selectedProjectId, navigateTo } = useAppContext();
  const { data: chapters = [], isLoading } =
    useGetChaptersForBook(selectedBookId);
  const [showNew, setShowNew] = useState(false);

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
          <Button
            data-ocid="book.new_chapter.button"
            onClick={() => setShowNew(true)}
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            <Plus className="w-4 h-4 mr-2" /> New Chapter
          </Button>
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
    </div>
  );
}
