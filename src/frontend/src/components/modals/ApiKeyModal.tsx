import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave?: (key: string) => void;
}

export default function ApiKeyModal({ open, onClose, onSave }: Props) {
  const { setApiKey } = useAppContext();
  const [value, setValue] = useState("");

  const handleSave = () => {
    if (!value.trim()) return;
    setApiKey(value.trim());
    onSave?.(value.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-md"
        data-ocid="apikey.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key
              className="w-4 h-4"
              style={{ color: "oklch(var(--blue-action))" }}
            />
            Gemini API Key
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your Google Gemini API key to enable AI features. It will be
            stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            data-ocid="apikey.input"
            type="password"
            placeholder="AIza..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="bg-input border-border"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <p className="text-xs text-muted-foreground">
            Get your key at{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              aistudio.google.com
            </a>
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="apikey.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!value.trim()}
            data-ocid="apikey.save_button"
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
