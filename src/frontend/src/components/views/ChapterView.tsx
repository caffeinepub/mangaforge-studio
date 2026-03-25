import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Copy,
  FileDown,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import SketchCanvas from "../panels/SketchCanvas";

// ─── Mood ────────────────────────────────────────────────────────────────────

const MOODS = [
  { value: "tense", label: "Tense", color: "oklch(0.45 0.18 22)" },
  { value: "dramatic", label: "Dramatic", color: "oklch(0.4 0.15 350)" },
  { value: "comedic", label: "Comedic", color: "oklch(0.6 0.18 85)" },
  { value: "melancholy", label: "Melancholy", color: "oklch(0.45 0.1 250)" },
  { value: "action", label: "Action-packed", color: "oklch(0.5 0.2 28)" },
  { value: "mysterious", label: "Mysterious", color: "oklch(0.4 0.12 280)" },
  { value: "romantic", label: "Romantic", color: "oklch(0.5 0.18 355)" },
];

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    label: "Fight Scene",
    text: "Characters clash in a dynamic action pose, speed lines fill the background. Debris and dust clouds from the impact. Extreme foreshortening on the lead strike.",
  },
  {
    label: "Conversation",
    text: "Two characters face each other, one speaking with an expression of intensity. Close-up alternating shots, subtle background detail showing the environment's mood.",
  },
  {
    label: "Establishing Shot",
    text: "Wide aerial view of [location], the city sprawls below bathed in golden hour light. Tiny figures visible on the streets, massive structures frame the composition.",
  },
  {
    label: "Emotional Close-Up",
    text: "Extreme close-up on [character]'s face, tears or sweat forming at the edge of their eyes. The background blurs into abstract shapes reflecting their inner state.",
  },
  {
    label: "Action Panel",
    text: "Character mid-motion, dramatic lighting casts sharp shadows. Detailed debris and impact effects surround them. Motion blur on limbs emphasizes speed and power.",
  },
];

// ─── Clarify Modal ────────────────────────────────────────────────────────────

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
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    if (!actor || !apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setLoading(true);
    const prompt = `A manga artist wrote this panel description: "${description}"\nGenerate exactly 3 short clarifying questions to help make it more detailed. Return as a numbered list only.`;
    callGemini(actor, apiKey, prompt)
      .then((result) => {
        const lines = result
          .split("\n")
          .filter((l: string) => l.match(/^\d+[.)]/))
          .slice(0, 3);
        setQuestions(lines);
        setAnswers(new Array(lines.length).fill(""));
        setStep("answer");
      })
      .catch(() => {
        toast.error("AI failed to generate questions");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [actor, apiKey, description, onClose, setShowApiKeyModal]);

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

// ─── Dialogue Lines ───────────────────────────────────────────────────────────

interface DialogueLine {
  character: string;
  text: string;
}

function DialoguesPopover({ panelId }: { panelId: string }) {
  const storageKey = `dialogues_panel_${panelId}`;
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<DialogueLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  });
  const [newChar, setNewChar] = useState("");
  const [newText, setNewText] = useState("");

  const save = (updated: DialogueLine[]) => {
    setLines(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const addLine = () => {
    if (!newText.trim()) return;
    save([...lines, { character: newChar.trim(), text: newText.trim() }]);
    setNewChar("");
    setNewText("");
  };

  const removeLine = (i: number) => save(lines.filter((_, li) => li !== i));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-xs"
          data-ocid="panel.dialogues.button"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          {lines.length > 0 && (
            <span
              className="text-xs rounded-full px-1"
              style={{
                background: "oklch(var(--amber) / 0.2)",
                color: "oklch(var(--amber))",
              }}
            >
              {lines.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 bg-card border-border p-3 space-y-3"
        data-ocid="panel.dialogues.popover"
      >
        <p className="text-xs font-semibold uppercase tracking-wider">
          Dialogues
        </p>
        {lines.length > 0 && (
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div
                key={`${i}-${l.text.slice(0, 10)}`}
                className="flex items-start gap-2"
              >
                <div className="flex-1">
                  {l.character && (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "oklch(var(--amber))" }}
                    >
                      {l.character}:{" "}
                    </span>
                  )}
                  <span className="text-xs">{l.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  data-ocid="panel.dialogue.delete_button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          <input
            placeholder="Character name (optional)"
            value={newChar}
            onChange={(e) => setNewChar(e.target.value)}
            className="w-full text-xs bg-input border border-border rounded px-2 py-1"
            data-ocid="panel.dialogue.char.input"
          />
          <textarea
            placeholder="Dialogue or narration text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full text-xs bg-input border border-border rounded px-2 py-1 resize-none"
            rows={2}
            data-ocid="panel.dialogue.text.textarea"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                addLine();
              }
            }}
          />
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={addLine}
            disabled={!newText.trim()}
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
            data-ocid="panel.dialogue.add.button"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Line
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Sketch Dialog ────────────────────────────────────────────────────────────

function SketchDialog({
  panelId,
  onClose,
}: {
  panelId: string;
  onClose: () => void;
}) {
  const storageKey = `sketch_panel_${panelId}`;
  const [initial] = useState<string | undefined>(
    localStorage.getItem(storageKey) ?? undefined,
  );

  const handleSave = (base64: string) => {
    localStorage.setItem(storageKey, base64);
    toast.success("Sketch saved!");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-2xl"
        data-ocid="sketch.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Panel Sketch
          </DialogTitle>
        </DialogHeader>
        <SketchCanvas
          initialData={initial}
          onSave={handleSave}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── AI Title Suggestions ─────────────────────────────────────────────────────

function TitleSuggestionsPopover({
  chapter,
  panels,
}: {
  chapter: ChapterWithId;
  panels: PanelWithId[];
}) {
  const { actor } = useActor();
  const { apiKey, setShowApiKeyModal } = useAppContext();
  const [open, setOpen] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const suggest = async () => {
    if (!actor || !apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setLoading(true);
    try {
      const context = panels
        .map((p, i) => `Panel ${i + 1}: ${p.description || "(empty)"}`)
        .join("\n");
      const prompt = `Based on this manga chapter content:\nCurrent title: "${chapter.title}"\n${context}\n\nSuggest 5 creative, evocative chapter titles. Return as a numbered list only, one per line.`;
      const result = await callGemini(actor, apiKey, prompt);
      const lines = result
        .split("\n")
        .filter((l: string) => l.match(/^\d+[.)]/) || l.trim())
        .map((l: string) => l.replace(/^\d+[.)\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 5);
      setTitles(lines);
    } catch {
      toast.error("Failed to generate titles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!open && titles.length === 0) suggest();
          }}
          className="h-7 px-2"
          data-ocid="chapter.title_suggest.button"
        >
          <Wand2 className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 bg-card border-border p-3 space-y-2"
        data-ocid="chapter.title_suggest.popover"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider">
            Title Suggestions
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs"
            onClick={suggest}
            disabled={loading}
            data-ocid="chapter.title_suggest.refresh.button"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
          </Button>
        </div>
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading &&
          titles.map((t, i) => (
            <div
              key={`${i}-${t.slice(0, 20)}`}
              className="flex items-center justify-between gap-2 group"
            >
              <span className="text-sm flex-1 line-clamp-2">{t}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(t);
                  toast.success("Title copied!");
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                data-ocid="chapter.title_suggest.copy.button"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        {!loading && titles.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Click Refresh to generate
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Scene-to-Panels Generator ────────────────────────────────────────────────

interface GeneratedPanel {
  description: string;
  layoutId: number;
  selected: boolean;
}

function SceneGeneratorDialog({
  chapter,
  panelCount: _panelCount,
  onAdd,
  onClose,
}: {
  chapter: ChapterWithId;
  panelCount: number;
  onAdd: (panels: { description: string; layoutId: number }[]) => Promise<void>;
  onClose: () => void;
}) {
  const { actor } = useActor();
  const { apiKey, setShowApiKeyModal } = useAppContext();
  const [scene, setScene] = useState("");
  const [generated, setGenerated] = useState<GeneratedPanel[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleGenerate = async () => {
    if (!actor || !apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    if (!scene.trim()) return;
    setLoading(true);
    try {
      const prompt = `Break this manga scene into 3-6 individual panel descriptions with layout suggestions.\n\nScene: "${scene}"\nChapter: "${chapter.title}"\n\nFor each panel, output:\nPANEL [number]: [description]\nLAYOUT: [layout number 1-25]\n\nDescriptions should be vivid and detailed for manga art direction. No content restrictions.`;
      const result = await callGemini(actor, apiKey, prompt);
      const panelBlocks = result.split(/PANEL\s*\d+:/i).filter(Boolean);
      const panels: GeneratedPanel[] = panelBlocks
        .map((block) => {
          const layoutMatch = block.match(/LAYOUT:\s*(\d+)/i);
          const layoutId = layoutMatch
            ? Math.min(25, Math.max(1, Number(layoutMatch[1])))
            : 1;
          const desc = block.replace(/LAYOUT:\s*\d+/i, "").trim();
          return { description: desc, layoutId, selected: true };
        })
        .slice(0, 6);
      setGenerated(panels);
    } catch {
      toast.error("Scene generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const selected = generated.filter((p) => p.selected);
    if (selected.length === 0) return;
    setAdding(true);
    try {
      await onAdd(
        selected.map(({ description, layoutId }) => ({
          description,
          layoutId,
        })),
      );
      toast.success(`Added ${selected.length} panels!`);
      onClose();
    } catch {
      toast.error("Failed to add panels");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-2xl max-h-[85vh]"
        data-ocid="scene_gen.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles
              className="w-4 h-4"
              style={{ color: "oklch(var(--amber))" }}
            />
            Generate Panels from Scene
          </DialogTitle>
          <DialogDescription>
            Describe a scene and AI will break it into panel descriptions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="e.g. Two warriors clash at the edge of a cliff at sunset, lightning crackles between them..."
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              className="bg-input border-border resize-none"
              rows={3}
              data-ocid="scene_gen.scene.textarea"
            />
            <Button
              onClick={handleGenerate}
              disabled={loading || !scene.trim()}
              style={{
                background: "oklch(var(--amber) / 0.8)",
                color: "oklch(0.1 0 0)",
              }}
              data-ocid="scene_gen.generate.button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate Panels
                </>
              )}
            </Button>
          </div>

          {generated.length > 0 && (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {generated.map((p, i) => (
                  <div
                    key={`gen-${i}-${p.description.slice(0, 20)}`}
                    className="flex items-start gap-3 bg-input rounded-lg p-3"
                    data-ocid={`scene_gen.panel.item.${i + 1}`}
                  >
                    <Checkbox
                      checked={p.selected}
                      onCheckedChange={(checked) =>
                        setGenerated((prev) =>
                          prev.map((gp, gi) =>
                            gi === i ? { ...gp, selected: !!checked } : gp,
                          ),
                        )
                      }
                      data-ocid={`scene_gen.panel.checkbox.${i + 1}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground">
                          PANEL {i + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Layout {p.layoutId}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="scene_gen.cancel_button"
          >
            Cancel
          </Button>
          {generated.length > 0 && (
            <Button
              onClick={handleAdd}
              disabled={
                adding || generated.filter((p) => p.selected).length === 0
              }
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
              data-ocid="scene_gen.add.button"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add {generated.filter((p) => p.selected).length} Panels
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Panel Editor ─────────────────────────────────────────────────────────────

function PanelEditor({
  panel,
  index,
  total,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}: {
  panel: PanelWithId;
  index: number;
  total: number;
  onUpdate: (desc: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
}) {
  const [desc, setDesc] = useState(panel.description);
  const [showClarify, setShowClarify] = useState(false);
  const [showSketch, setShowSketch] = useState(false);

  const handleBlur = () => {
    if (desc !== panel.description) {
      onUpdate(desc);
    }
  };

  const layoutName =
    LAYOUTS.find((l) => l.id === Number(panel.layoutId))?.name ??
    `Layout ${panel.layoutId}`;

  const layout = LAYOUTS.find((l) => l.id === Number(panel.layoutId));
  const sketchData = localStorage.getItem(
    `sketch_panel_${panel.id.toString()}`,
  );

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Layout thumbnail */}
          {layout && (
            <svg
              viewBox="0 0 60 80"
              width="22"
              height="30"
              className="text-muted-foreground shrink-0"
            >
              <title>{layout.name}</title>
              {layout.elements}
            </svg>
          )}
          <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{layoutName}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Reorder */}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground"
            data-ocid="panel.move_up.button"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground"
            data-ocid="panel.move_down.button"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          {/* Duplicate */}
          <button
            type="button"
            onClick={onDuplicate}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            data-ocid="panel.duplicate.button"
            title="Duplicate panel"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {/* Dialogues */}
          <DialoguesPopover panelId={panel.id.toString()} />
          {/* Sketch */}
          <button
            type="button"
            onClick={() => setShowSketch(true)}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            data-ocid="panel.sketch.button"
            title="Sketch panel"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {/* Clarify */}
          {desc.split(" ").length < 20 && desc.trim() && (
            <button
              type="button"
              onClick={() => setShowClarify(true)}
              className="text-xs flex items-center gap-1 hover:text-foreground px-1"
              style={{ color: "oklch(var(--amber))" }}
              data-ocid="panel.clarify.button"
            >
              <Wand2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Templates dropdown */}
      <div className="flex items-start gap-2">
        <Textarea
          data-ocid="panel.description.textarea"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={handleBlur}
          placeholder="Describe what happens in this panel..."
          className="bg-input border-border resize-none text-sm flex-1"
          rows={3}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 mt-0.5 text-xs shrink-0"
              data-ocid="panel.templates.button"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-card border-border"
            data-ocid="panel.templates.dropdown_menu"
          >
            {TEMPLATES.map((t) => (
              <DropdownMenuItem
                key={t.label}
                onClick={() => {
                  setDesc(t.text);
                  onUpdate(t.text);
                }}
                className="text-xs flex flex-col items-start py-2"
              >
                <span className="font-semibold">{t.label}</span>
                <span className="text-muted-foreground line-clamp-2 mt-0.5">
                  {t.text.slice(0, 80)}...
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sketch thumbnail */}
      {sketchData && (
        <img
          src={sketchData}
          alt="panel sketch"
          className="w-full rounded border border-border object-cover"
          style={{ maxHeight: "120px" }}
        />
      )}

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
      {showSketch && (
        <SketchDialog
          panelId={panel.id.toString()}
          onClose={() => setShowSketch(false)}
        />
      )}
    </div>
  );
}

// ─── Chapter Thumbnail Strip ──────────────────────────────────────────────────

function ThumbnailStrip({
  panels,
  onScrollTo,
}: {
  panels: PanelWithId[];
  onScrollTo: (index: number) => void;
}) {
  if (panels.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-4 border-b border-border bg-card/30">
      {panels.map((panel, idx) => {
        const layout = LAYOUTS.find((l) => l.id === Number(panel.layoutId));
        return (
          <button
            key={panel.id.toString()}
            type="button"
            onClick={() => onScrollTo(idx)}
            className="flex-shrink-0 border border-border rounded hover:border-muted-foreground transition-colors"
            title={`Panel ${idx + 1}`}
            data-ocid={`chapter.thumbnail.item.${idx + 1}`}
            style={{ padding: "2px" }}
          >
            {layout ? (
              <svg
                viewBox="0 0 60 80"
                width="36"
                height="48"
                className="text-foreground/60"
              >
                <title>{layout.name}</title>
                {layout.elements}
              </svg>
            ) : (
              <div className="w-9 h-12 bg-muted rounded" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Print styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #chapter-print-area, #chapter-print-area * { visibility: visible !important; }
  #chapter-print-area { position: fixed; inset: 0; padding: 24px; background: white; color: black; }
  .panel-print-card { border: 1px solid #ccc; border-radius: 6px; padding: 12px; margin-bottom: 12px; break-inside: avoid; }
  .panel-print-num { font-weight: bold; font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
  .panel-print-desc { font-size: 13px; line-height: 1.6; }
  .chapter-print-title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
  .chapter-print-meta { font-size: 11px; color: #888; margin-bottom: 16px; }
}`;

// ─── Chapter View ─────────────────────────────────────────────────────────────

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
  const [showSceneGen, setShowSceneGen] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "mangaforge-print-styles";
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    return () => {
      document.getElementById("mangaforge-print-styles")?.remove();
    };
  }, []);

  // Mood
  const moodKey = `mood_chapter_${selectedChapterId?.toString()}`;
  const [mood, setMood] = useState(() => localStorage.getItem(moodKey) ?? "");

  // Notes
  const notesKey = `notes_chapter_${selectedChapterId?.toString()}`;
  const [notes, setNotes] = useState(
    () => localStorage.getItem(notesKey) ?? "",
  );
  const [notesOpen, setNotesOpen] = useState(false);

  // Panel refs for scrolling
  const panelRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const chapter = chapters.find((c) => c.id === selectedChapterId);

  const wordCount = panels.reduce(
    (acc, p) => acc + (p.description?.split(/\s+/).filter(Boolean).length ?? 0),
    0,
  );

  const handleMoodChange = (val: string) => {
    setMood(val);
    localStorage.setItem(moodKey, val);
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    localStorage.setItem(notesKey, val);
  };

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

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const now = BigInt(Date.now()) * BigInt(1000000);
    const above = panels[index - 1];
    const current = panels[index];
    if (!above || !current) return;
    try {
      await Promise.all([
        updatePanel({
          id: current.id,
          panel: { ...current, orderIndex: BigInt(index - 1), updatedAt: now },
        }),
        updatePanel({
          id: above.id,
          panel: { ...above, orderIndex: BigInt(index), updatedAt: now },
        }),
      ]);
    } catch {
      toast.error("Failed to reorder panels");
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= panels.length - 1) return;
    const now = BigInt(Date.now()) * BigInt(1000000);
    const below = panels[index + 1];
    const current = panels[index];
    if (!below || !current) return;
    try {
      await Promise.all([
        updatePanel({
          id: current.id,
          panel: { ...current, orderIndex: BigInt(index + 1), updatedAt: now },
        }),
        updatePanel({
          id: below.id,
          panel: { ...below, orderIndex: BigInt(index), updatedAt: now },
        }),
      ]);
    } catch {
      toast.error("Failed to reorder panels");
    }
  };

  const handleDuplicate = async (panel: PanelWithId, index: number) => {
    if (!selectedChapterId) return;
    try {
      await createPanel({
        chapterId: selectedChapterId,
        layoutId: Number(panel.layoutId),
        description: panel.description,
        orderIndex: index + 1,
      });
      toast.success("Panel duplicated!");
    } catch {
      toast.error("Failed to duplicate panel");
    }
  };

  const handleAddFromScene = async (
    generated: { description: string; layoutId: number }[],
  ) => {
    if (!selectedChapterId) return;
    for (let i = 0; i < generated.length; i++) {
      const p = generated[i];
      if (!p) continue;
      await createPanel({
        chapterId: selectedChapterId,
        layoutId: p.layoutId,
        description: p.description,
        orderIndex: panels.length + i,
      });
    }
  };

  const handleScrollTo = (index: number) => {
    const el = panelRefs.current.get(index);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const handleExportPDF = () => {
    window.print();
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

  const moodConfig = MOODS.find((m) => m.value === mood);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Print area (hidden on screen) */}
      <div id="chapter-print-area" style={{ display: "none" }}>
        <div className="chapter-print-title">{chapter.title}</div>
        <div className="chapter-print-meta">
          {panels.length} panels · ~{wordCount} words
          {moodConfig && ` · ${moodConfig.label}`}
        </div>
        {panels.map((panel, idx) => (
          <div key={panel.id.toString()} className="panel-print-card">
            <div className="panel-print-num">Panel {idx + 1}</div>
            <div className="panel-print-desc">
              {panel.description || "(no description)"}
            </div>
          </div>
        ))}
        {notes && (
          <div
            style={{
              marginTop: "16px",
              borderTop: "1px solid #ccc",
              paddingTop: "8px",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              Notes
            </div>
            <div style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}>
              {notes}
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-sm">{chapter.title}</h2>
            <TitleSuggestionsPopover chapter={chapter} panels={panels} />
            {moodConfig && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: `${moodConfig.color}33`,
                  color: moodConfig.color,
                }}
              >
                {moodConfig.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Stats */}
            <span className="text-xs text-muted-foreground hidden sm:block">
              {panels.length} panels · ~{wordCount} words
            </span>

            {/* Mood selector */}
            <Select value={mood} onValueChange={handleMoodChange}>
              <SelectTrigger
                className="h-7 w-auto text-xs border-border"
                data-ocid="chapter.mood.select"
              >
                <SelectValue placeholder="Mood" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="" className="text-xs">
                  No mood
                </SelectItem>
                {MOODS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLayoutPicker((p) => !p)}
              data-ocid="chapter.layout_picker.toggle"
              className="h-7"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSceneGen(true)}
              data-ocid="chapter.scene_gen.button"
              className="h-7"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleAiHelp}
              disabled={aiLoading}
              data-ocid="chapter.ai_help.button"
              className="h-7"
              style={{ background: "oklch(0.45 0.12 280)", color: "white" }}
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPDF}
              data-ocid="chapter.export_pdf.button"
              className="h-7"
            >
              <FileDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <ThumbnailStrip panels={panels} onScrollTo={handleScrollTo} />

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
                  Select a layout and click "Add Panel" or generate from a scene
                </p>
              </div>
            )}

            {panels.map((panel, idx) => (
              <div
                key={panel.id.toString()}
                data-ocid={`chapter.panel.item.${idx + 1}`}
                ref={(el) => {
                  if (el) panelRefs.current.set(idx, el);
                  else panelRefs.current.delete(idx);
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    PANEL {idx + 1}
                  </span>
                </div>
                <PanelEditor
                  panel={panel}
                  index={idx}
                  total={panels.length}
                  onUpdate={(desc) => handleUpdatePanel(panel, desc)}
                  onMoveUp={() => handleMoveUp(idx)}
                  onMoveDown={() => handleMoveDown(idx)}
                  onDuplicate={() => handleDuplicate(panel, idx)}
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

          {/* Notes section */}
          <div className="mx-4 mb-4">
            <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2 w-full"
                  data-ocid="chapter.notes.toggle"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  Notes
                  {notesOpen ? (
                    <ChevronUp className="w-3 h-3 ml-auto" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-auto" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Textarea
                  placeholder="Pin your notes for this chapter here..."
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="bg-input border-border resize-none text-sm w-full"
                  rows={4}
                  data-ocid="chapter.notes.textarea"
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </div>

      {showSceneGen && chapter && (
        <SceneGeneratorDialog
          chapter={chapter}
          panelCount={panels.length}
          onAdd={handleAddFromScene}
          onClose={() => setShowSceneGen(false)}
        />
      )}
    </div>
  );
}
