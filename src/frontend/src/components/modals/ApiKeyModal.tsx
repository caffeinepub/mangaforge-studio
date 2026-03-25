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
import { AlertCircle, Key, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import { useActor } from "../../hooks/useActor";
import { callGemini } from "../../utils/gemini";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave?: (key: string) => void;
}

export default function ApiKeyModal({ open, onClose, onSave }: Props) {
  const { setApiKey } = useAppContext();
  const { actor } = useActor();
  const [value, setValue] = useState("");
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    const key = value.trim();
    if (!key) return;
    if (!actor) {
      setErrorMsg("Studio not ready. Please try again.");
      return;
    }
    setValidating(true);
    setErrorMsg(null);
    try {
      const result = await callGemini(actor, key, "Say OK");
      // Only reject if the raw response contains API-level error indicators
      const isApiError =
        !result ||
        result.includes('"error"') ||
        result.toLowerCase().includes("api key not valid") ||
        result.toLowerCase().includes("api_key_invalid") ||
        result.toLowerCase().includes("permission_denied") ||
        result.toLowerCase().includes("invalid api key");
      if (isApiError) {
        setErrorMsg("API key is invalid. Please check and try again.");
        return;
      }
      setApiKey(key);
      onSave?.(key);
      toast.success("API key saved successfully!");
      onClose();
    } catch {
      setErrorMsg("API key is invalid. Please check and try again.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !validating && onClose()}>
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
            onChange={(e) => {
              setValue(e.target.value);
              setErrorMsg(null);
            }}
            className="bg-input border-border"
            onKeyDown={(e) => e.key === "Enter" && !validating && handleSave()}
            disabled={validating}
          />
          {errorMsg && (
            <div
              className="flex items-center gap-2 text-xs text-destructive"
              data-ocid="apikey.error_state"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorMsg}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Get your free key at{" "}
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
            disabled={validating}
            data-ocid="apikey.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!value.trim() || validating}
            data-ocid="apikey.save_button"
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Validating...
              </>
            ) : (
              "Save Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
