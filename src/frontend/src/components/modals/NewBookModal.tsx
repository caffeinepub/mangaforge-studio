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
import { useCreateBook } from "../../hooks/useQueries";

interface Props {
  projectId: bigint;
  open: boolean;
  onClose: () => void;
}

export default function NewBookModal({ projectId, open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const { mutateAsync, isPending } = useCreateBook();
  const { navigateTo, selectedProjectId } = useAppContext();

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const id = await mutateAsync({
        title: title.trim(),
        synopsis: synopsis.trim(),
        projectId,
      });
      navigateTo(selectedProjectId, id);
      toast.success("Book created!");
      onClose();
    } catch {
      toast.error("Failed to create book");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-md"
        data-ocid="new_book.dialog"
      >
        <DialogHeader>
          <DialogTitle>New Book</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Book Title</Label>
            <Input
              data-ocid="new_book.input"
              placeholder="e.g. Volume 1: The Awakening"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Synopsis</Label>
            <Textarea
              data-ocid="new_book.textarea"
              placeholder="Brief summary of this book..."
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
            data-ocid="new_book.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isPending}
            data-ocid="new_book.submit_button"
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Create Book
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
