import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Calendar, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useGetBooksForProject } from "../../hooks/useQueries";
import NewBookModal from "../modals/NewBookModal";

export default function ProjectView() {
  const { selectedProjectId, navigateTo } = useAppContext();
  const { data: books = [], isLoading } =
    useGetBooksForProject(selectedProjectId);
  const [showNew, setShowNew] = useState(false);

  if (!selectedProjectId) return null;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Books</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize your manga into volumes and books
            </p>
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
