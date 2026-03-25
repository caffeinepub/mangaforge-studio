import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveUserProfile } from "../../hooks/useQueries";

interface Props {
  open: boolean;
}

export default function ProfileSetupModal({ open }: Props) {
  const [name, setName] = useState("");
  const { mutateAsync, isPending } = useSaveUserProfile();

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await mutateAsync(name.trim());
      toast.success("Welcome to MangaForge!");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-card border-border sm:max-w-sm"
        data-ocid="profile_setup.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Zap
              className="w-5 h-5"
              style={{ color: "oklch(var(--red-brand))" }}
            />
            <span
              className="font-display font-bold tracking-widest"
              style={{ color: "oklch(var(--red-brand))" }}
            >
              MANGAFORGE
            </span>
          </div>
          <DialogTitle>Welcome, Creator!</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set your creator name to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="creator-name">Your Name</Label>
          <Input
            id="creator-name"
            data-ocid="profile_setup.input"
            placeholder="e.g. Akira Sensei"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-input border-border"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={!name.trim() || isPending}
          data-ocid="profile_setup.submit_button"
          className="w-full"
          style={{ background: "oklch(var(--blue-action))", color: "white" }}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Enter the Studio
        </Button>
      </DialogContent>
    </Dialog>
  );
}
