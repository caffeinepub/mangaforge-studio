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
import { useCreateProject } from "../../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewProjectModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { mutateAsync, isPending } = useCreateProject();
  const { navigateTo } = useAppContext();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const id = await mutateAsync({
        name: name.trim(),
        description: description.trim(),
      });
      navigateTo(id);
      toast.success("Project created!");
      onClose();
    } catch {
      toast.error("Failed to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-md"
        data-ocid="new_project.dialog"
      >
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Project Name</Label>
            <Input
              data-ocid="new_project.input"
              placeholder="e.g. Shadow Realm Chronicles"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              data-ocid="new_project.textarea"
              placeholder="What's this manga about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-input border-border resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="new_project.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isPending}
            data-ocid="new_project.submit_button"
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
