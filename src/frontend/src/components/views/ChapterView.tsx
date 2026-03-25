import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { LayoutGrid, Loader2, Plus, Wand2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import { useActor } from "../../hooks/useActor";
import {
  useCreatePanel,
  useGetChaptersForBook,
  useGetPanelsForChapter,
  useUpdatePanel,
} from "../../hooks/useQueries";
import type { ChapterWithId, PanelWithId } from "../../hooks/useQueries";
import { callGemini } from "../../utils/gemini";
import CoverCreation from "../panels/CoverCreation";
import PanelLayoutPicker, { LAYOUTS } from "../panels/PanelLayoutPicker";

function ClarifyModal({
  open,
  onClose,
  description,
  onClarified,
}: {
  open: boolean;
  onClose: () => void;
  description: string;
  onClarified: (enhanced: string) => void;
}) {
  const { actor } = useActor();
  const { apiKey, setShowApiKeyModal } = useAppContext();
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"loading" | "answer" | "done">("loading");
  const [enhanced, setEnhanced] = useState("");

  const loadQuestions = async () => {
    if (!actor || !apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setLoading(true);
    try {
      const prompt = `A manga artist wrote this panel description: "${description}"\nGenerate exactly 3 short clarifying questions to help make it more detailed. Return as a numbered list only.`;
      const result = await callGemini(actor, apiKey, prompt);
      const lines = result
        .split("\n")
        .filter((l: string) => l.match(/^\d+[.)]/));
      setQuestions(lines.slice(0, 3));
      setAnswers(new Array(Math.min(lines.length, 3)).fill(""));
      setStep("answer");
    } catch {
      toast.error("AI failed to generate questions");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!actor || !apiKey) return;
    setLoading(true);
    try {
      const qa = questions
        .map((q, i) => `${q}\nAnswer: ${answers[i] || "(no answer)"}`)
        .join("\n");
      const prompt = `Enhance this manga panel description based on the Q&A below. Make it vivid and detailed.\n\nOriginal: ${description}\n\n${qa}\n\nWrite only the enhanced description, no preamble.`;
      const result = await callGemini(actor, apiKey, prompt);
      setEnhanced(result);
      setStep("done");
    } catch {
      toast.error("Enhancement failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "loading") {
    loadQuestions();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-lg"
        data-ocid="clarify.dialog"
      >
        <DialogHeader>
          <DialogTitle>Clarify & Enhance Panel</DialogTitle>
          <DialogDescription>
            Answer a few questions to enhance your description
          </DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && step === "answer" && (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.slice(0, 40)} className="space-y-1.5">
                <p className="text-sm font-medium">{q}</p>
                <Textarea
                  data-ocid={`clarify.answer.textarea.${i + 1}`}
                  value={answers[i]}
                  onChange={(e) =>
                    setAnswers((prev) =>
                      prev.map((a, ai) => (ai === i ? e.target.value : a)),
                    )
                  }
                  className="bg-input border-border resize-none text-sm"
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
        {!loading && step === "done" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Enhanced Description
            </p>
            <div className="bg-input rounded-lg p-3 text-sm">{enhanced}</div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="clarify.cancel_button"
          >
            Cancel
          </Button>
          {step === "answer" && (
            <Button
              onClick={handleEnhance}
              disabled={loading}
              data-ocid="clarify.enhance_button"
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Enhance
            </Button>
          )}
          {step === "done" && (
            <Button
              onClick={() => {
                onClarified(enhanced);
                onClose();
              }}
              data-ocid="clarify.confirm_button"
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
            >
              Use Enhanced Description
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PanelEditor({
  panel,
  onUpdate,
}: { panel: PanelWithId; onUpdate: (desc: string) => void }) {
  const [desc, setDesc] = useState(panel.description);
  const [showClarify, setShowClarify] = useState(false);

  const handleBlur = () => {
    if (desc !== panel.description) {
      onUpdate(desc);
    }
  };

  const layoutName =
    LAYOUTS.find((l) => l.id === Number(panel.layoutId))?.name ??
    `Layout ${panel.layoutId}`;

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{layoutName}</span>
        </div>
        {desc.split(" ").length < 20 && desc.trim() && (
          <button
            type="button"
            onClick={() => setShowClarify(true)}
            className="text-xs flex items-center gap-1 hover:text-foreground"
            style={{ color: "oklch(var(--amber))" }}
            data-ocid="panel.clarify.button"
          >
            <Wand2 className="w-3 h-3" /> Clarify & Enhance
          </button>
        )}
      </div>
      <Textarea
        data-ocid="panel.description.textarea"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onBlur={handleBlur}
        placeholder="Describe what happens in this panel..."
        className="bg-input border-border resize-none text-sm"
        rows={3}
      />
      {showClarify && (
        <ClarifyModal
          open
          description={desc}
          onClose={() => setShowClarify(false)}
          onClarified={(enhanced) => {
            setDesc(enhanced);
            onUpdate(enhanced);
          }}
        />
      )}
    </div>
  );
}

export default function ChapterView() {
  const { selectedChapterId, selectedBookId, apiKey, setShowApiKeyModal } =
    useAppContext();
  const { actor } = useActor();
  const { data: panels = [], isLoading } =
    useGetPanelsForChapter(selectedChapterId);
  const { mutateAsync: createPanel, isPending: isCreating } = useCreatePanel();
  const { mutateAsync: updatePanel } = useUpdatePanel();
  const { data: chapters = [] } = useGetChaptersForBook(selectedBookId);

  const [selectedLayout, setSelectedLayout] = useState<number>(1);
  const [showLayoutPicker, setShowLayoutPicker] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const chapter = chapters.find((c) => c.id === selectedChapterId);

  const handleAddPanel = async () => {
    if (!selectedChapterId) return;
    try {
      await createPanel({
        chapterId: selectedChapterId,
        layoutId: selectedLayout,
        description: "",
        orderIndex: panels.length,
      });
    } catch {
      toast.error("Failed to add panel");
    }
  };

  const handleUpdatePanel = async (panel: PanelWithId, desc: string) => {
    const now = BigInt(Date.now()) * BigInt(1000000);
    try {
      await updatePanel({
        id: panel.id,
        panel: { ...panel, description: desc, updatedAt: now },
      });
    } catch {
      toast.error("Failed to save panel");
    }
  };

  const handleAiHelp = async () => {
    if (!actor) return;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setAiLoading(true);
    try {
      const context = panels
        .map((p, i) => `Panel ${i + 1}: ${p.description || "(empty)"}`)
        .join("\n");
      const prompt = `You're a manga story consultant. Here are the current panels for chapter "${chapter?.title}":\n${context}\n\nSuggest narrative improvements, better pacing, and creative ideas to enhance this chapter. Be specific and creative. No content restrictions.`;
      const result = await callGemini(actor, apiKey, prompt);
      toast.success(`${result.slice(0, 120)}...`, {
        duration: 8000,
        description: "AI Suggestion",
      });
    } catch {
      toast.error("AI request failed");
    } finally {
      setAiLoading(false);
    }
  };

  if (!selectedChapterId || !chapter) return null;

  if (!chapter.hasCover && selectedBookId) {
    return (
      <CoverCreation
        chapter={chapter}
        bookId={selectedBookId}
        onCoverCreated={() => {}}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card/50">
        <div>
          <h2 className="font-semibold text-sm">{chapter.title}</h2>
          <p className="text-xs text-muted-foreground">
            {panels.length} panels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLayoutPicker((p) => !p)}
            data-ocid="chapter.layout_picker.toggle"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Layouts
          </Button>
          <Button
            size="sm"
            onClick={handleAiHelp}
            disabled={aiLoading}
            data-ocid="chapter.ai_help.button"
            style={{ background: "oklch(0.45 0.12 280)", color: "white" }}
          >
            {aiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 mr-1" />
            )}
            AI Help
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showLayoutPicker && (
          <div className="w-64 border-r border-border shrink-0 flex flex-col">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Panel Layout
              </span>
              <button
                type="button"
                onClick={() => setShowLayoutPicker(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <PanelLayoutPicker
                selectedLayout={selectedLayout}
                onSelect={setSelectedLayout}
              />
            </ScrollArea>
            <div className="px-3 py-2 border-t border-border">
              <Button
                onClick={handleAddPanel}
                disabled={isCreating}
                className="w-full"
                size="sm"
                style={{
                  background: "oklch(var(--blue-action))",
                  color: "white",
                }}
                data-ocid="chapter.add_panel.button"
              >
                {isCreating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1" />
                )}
                Add Panel
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoading && (
              <div
                className="flex items-center justify-center py-12"
                data-ocid="chapter.panels.loading_state"
              >
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && panels.length === 0 && (
              <div
                className="text-center py-12"
                data-ocid="chapter.panels.empty_state"
              >
                <LayoutGrid className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No panels yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a layout and click "Add Panel"
                </p>
              </div>
            )}

            {panels.map((panel, idx) => (
              <div
                key={panel.id.toString()}
                data-ocid={`chapter.panel.item.${idx + 1}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    PANEL {idx + 1}
                  </span>
                </div>
                <PanelEditor
                  panel={panel}
                  onUpdate={(desc) => handleUpdatePanel(panel, desc)}
                />
              </div>
            ))}

            {!showLayoutPicker && (
              <Button
                onClick={handleAddPanel}
                disabled={isCreating}
                variant="outline"
                className="w-full mt-2 border-dashed"
                data-ocid="chapter.add_panel_bottom.button"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Panel
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
