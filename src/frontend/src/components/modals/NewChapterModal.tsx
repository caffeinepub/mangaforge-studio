import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import {
  useCreateChapter,
  useGetChaptersForBook,
} from "../../hooks/useQueries";

interface Props {
  bookId: bigint;
  open: boolean;
  onClose: () => void;
}

export default function NewChapterModal({ bookId, open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const { mutateAsync, isPending } = useCreateChapter();
  const { navigateTo, selectedProjectId, selectedBookId } = useAppContext();
  const { data: existingChapters = [] } = useGetChaptersForBook(bookId);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const id = await mutateAsync({
        title: title.trim(),
        synopsis: synopsis.trim(),
        bookId,
        orderIndex: existingChapters.length,
      });
      navigateTo(selectedProjectId, selectedBookId ?? bookId, id);
      toast.success("Chapter created!");
      onClose();
    } catch {
      toast.error("Failed to create chapter");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-md"
        data-ocid="new_chapter.dialog"
      >
        <DialogHeader>
          <DialogTitle>New Chapter</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Chapter Title</Label>
            <Input
              data-ocid="new_chapter.input"
              placeholder="e.g. Chapter 1: The Beginning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Synopsis</Label>
            <Textarea
              data-ocid="new_chapter.textarea"
              placeholder="What happens in this chapter?"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="bg-input border-border resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="new_chapter.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isPending}
            data-ocid="new_chapter.submit_button"
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Create Chapter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
