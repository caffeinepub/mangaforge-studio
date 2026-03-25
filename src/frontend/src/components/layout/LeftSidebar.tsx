import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  PanelLeft,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import {
  useGetAllProjects,
  useGetBooksForProject,
  useGetChaptersForBook,
} from "../../hooks/useQueries";
import NewBookModal from "../modals/NewBookModal";
import NewChapterModal from "../modals/NewChapterModal";
import NewProjectModal from "../modals/NewProjectModal";

function ChapterItems({ bookId }: { bookId: bigint }) {
  const { data: chapters = [] } = useGetChaptersForBook(bookId);
  const { selectedChapterId, navigateTo, selectedProjectId, selectedBookId } =
    useAppContext();
  return (
    <>
      {chapters.map((ch) => (
        <button
          type="button"
          key={ch.id.toString()}
          data-ocid="sidebar.chapter.button"
          onClick={() => navigateTo(selectedProjectId, selectedBookId, ch.id)}
          className={`sidebar-tree-item pl-10 w-full text-left ${selectedChapterId === ch.id ? "active" : ""}`}
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate text-xs">{ch.title}</span>
        </button>
      ))}
    </>
  );
}

function BookItems({ projectId }: { projectId: bigint }) {
  const { data: books = [] } = useGetBooksForProject(projectId);
  const { selectedBookId, navigateTo, selectedProjectId } = useAppContext();
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [addChapterForBook, setAddChapterForBook] = useState<bigint | null>(
    null,
  );

  const toggle = (id: string) => {
    setExpandedBooks((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <>
      {books.map((book) => {
        const idStr = book.id.toString();
        const expanded = expandedBooks.has(idStr);
        return (
          <div key={idStr}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => toggle(idStr)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
              <button
                type="button"
                data-ocid="sidebar.book.button"
                onClick={() => navigateTo(selectedProjectId, book.id)}
                className={`sidebar-tree-item flex-1 pl-0 ${selectedBookId === book.id ? "active" : ""}`}
              >
                <BookOpen className="w-3 h-3 shrink-0" />
                <span className="truncate text-xs">{book.title}</span>
              </button>
              <button
                type="button"
                onClick={() => setAddChapterForBook(book.id)}
                className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                title="Add Chapter"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {expanded && (
              <div>
                <ChapterItems bookId={book.id} />
                <button
                  type="button"
                  data-ocid="sidebar.add_chapter.button"
                  onClick={() => setAddChapterForBook(book.id)}
                  className="sidebar-tree-item pl-10 w-full text-left text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3 h-3" />
                  <span className="text-xs">Add Chapter</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
      {addChapterForBook && (
        <NewChapterModal
          bookId={addChapterForBook}
          open
          onClose={() => setAddChapterForBook(null)}
        />
      )}
    </>
  );
}

export default function LeftSidebar() {
  const { data: projects = [] } = useGetAllProjects();
  const { selectedProjectId, navigateTo } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [showNewProject, setShowNewProject] = useState(false);
  const [addBookForProject, setAddBookForProject] = useState<bigint | null>(
    null,
  );

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  if (collapsed) {
    return (
      <aside className="w-10 border-r border-border bg-sidebar flex flex-col items-center pt-3">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="text-muted-foreground hover:text-foreground p-1"
          data-ocid="sidebar.expand.button"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Projects
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-ocid="sidebar.new_project.button"
            onClick={() => setShowNewProject(true)}
            className="text-muted-foreground hover:text-foreground"
            title="New Project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {projects.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No projects yet
            </div>
          )}
          {projects.map((proj) => {
            const idStr = proj.id.toString();
            const expanded = expandedProjects.has(idStr);
            return (
              <div key={idStr} className="group">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => toggleProject(idStr)}
                    className="p-1 text-muted-foreground hover:text-foreground ml-1"
                  >
                    {expanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    data-ocid="sidebar.project.button"
                    onClick={() => navigateTo(proj.id)}
                    className={`sidebar-tree-item flex-1 pl-0 ${
                      selectedProjectId === proj.id ? "active" : ""
                    }`}
                  >
                    <FolderOpen className="w-3 h-3 shrink-0" />
                    <span className="truncate text-xs font-medium">
                      {proj.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddBookForProject(proj.id)}
                    className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                    title="Add Book"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {expanded && (
                  <div>
                    <BookItems projectId={proj.id} />
                    <button
                      type="button"
                      data-ocid="sidebar.add_book.button"
                      onClick={() => setAddBookForProject(proj.id)}
                      className="sidebar-tree-item pl-7 w-full text-left text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="text-xs">Add Book</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {showNewProject && (
        <NewProjectModal open onClose={() => setShowNewProject(false)} />
      )}
      {addBookForProject && (
        <NewBookModal
          projectId={addBookForProject}
          open
          onClose={() => setAddBookForProject(null)}
        />
      )}
    </aside>
  );
}
