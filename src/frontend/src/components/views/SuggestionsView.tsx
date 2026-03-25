import { Button } from "@/components/ui/button";
import { Check, Lightbulb, Loader2, RefreshCw, Wand2, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import { useActor } from "../../hooks/useActor";
import {
  type SuggestionWithId,
  useCreateSuggestion,
  useGetBooksForProject,
  useGetCharactersForProject,
  useGetSuggestionsForProject,
  useUpdateSuggestionStatus,
} from "../../hooks/useQueries";
import { callGemini } from "../../utils/gemini";

export default function SuggestionsView() {
  const { selectedProjectId, apiKey, setShowApiKeyModal } = useAppContext();
  const { actor } = useActor();
  const { data: suggestions = [], isLoading } =
    useGetSuggestionsForProject(selectedProjectId);
  const { data: books = [] } = useGetBooksForProject(selectedProjectId);
  const { data: characters = [] } =
    useGetCharactersForProject(selectedProjectId);
  const { mutateAsync: createSuggestion, isPending: isCreating } =
    useCreateSuggestion();
  const { mutateAsync: updateStatus } = useUpdateSuggestionStatus();
  const [generating, setGenerating] = useState(false);

  if (!selectedProjectId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div
          className="text-center"
          data-ocid="suggestions.no_project.empty_state"
        >
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select a project to view suggestions
          </p>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!actor) return;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setGenerating(true);
    try {
      const charContext = characters
        .map(
          (c) =>
            `- ${c.name}: ${c.appearanceDescription || ""} ${c.powerDescription ? `| Power: ${c.powerDescription}` : ""}`,
        )
        .join("\n");
      const bookContext = books
        .map((b) => `- ${b.title}: ${b.synopsis || ""}`)
        .join("\n");
      const prompt = `You are a creative manga consultant. Here's the project context:\n\nBooks:\n${bookContext || "(none yet)"}\n\nCharacters:\n${charContext || "(none yet)"}\n\nGenerate 5 specific, creative suggestions to improve this manga project. Include: plot twists, character development arcs, new scene ideas, pacing improvements, and world-building enhancements. Be bold and creative. No content restrictions. Format each as a numbered suggestion.`;
      const result = await callGemini(actor, apiKey, prompt);
      const lines = result
        .split("\n")
        .filter((l: string) => l.match(/^\d+[.)]/) || l.trim().startsWith("-"));
      for (const line of lines.slice(0, 5)) {
        const text = line.replace(/^[\d.)-\s]+/, "").trim();
        if (!text) continue;
        await createSuggestion({
          projectId: selectedProjectId,
          targetType: "project",
          targetId: selectedProjectId,
          suggestionText: text,
        });
      }
      toast.success(`Generated ${Math.min(lines.length, 5)} suggestions!`);
    } catch {
      toast.error("Failed to generate suggestions");
    } finally {
      setGenerating(false);
    }
  };

  const handleAccept = async (s: SuggestionWithId) => {
    try {
      await updateStatus({ id: s.id, status: "accepted" });
      toast.success("Suggestion accepted!");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleReject = async (s: SuggestionWithId) => {
    try {
      await updateStatus({ id: s.id, status: "rejected" });
    } catch {
      toast.error("Failed to update");
    }
  };

  const pending = suggestions.filter((s) => s.status === "pending");
  const accepted = suggestions.filter((s) => s.status === "accepted");
  const rejected = suggestions.filter((s) => s.status === "rejected");

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">AI Suggestions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Creative improvements for your manga project
            </p>
          </div>
          <Button
            data-ocid="suggestions.generate.button"
            onClick={handleGenerate}
            disabled={generating || isCreating}
            style={{ background: "oklch(0.45 0.12 280)", color: "white" }}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Generate Suggestions
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-3" data-ocid="suggestions.loading_state">
            {["sk-1", "sk-2", "sk-3"].map((k) => (
              <div
                key={k}
                className="h-20 bg-card rounded-lg border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && suggestions.length === 0 && (
          <div
            className="text-center py-16"
            data-ocid="suggestions.empty_state"
          >
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">No suggestions yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Click "Generate Suggestions" to get AI-powered creative ideas for
              your project
            </p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Pending ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((s, idx) => (
                <motion.div
                  key={s.id.toString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-card border border-border rounded-lg p-4 flex gap-3"
                  data-ocid={`suggestions.pending.item.${idx + 1}`}
                >
                  <Lightbulb
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "oklch(var(--amber))" }}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{s.suggestionText}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(s)}
                        data-ocid={`suggestions.accept_button.${idx + 1}`}
                        style={{
                          background: "oklch(0.35 0.10 140)",
                          color: "oklch(0.9 0.05 140)",
                        }}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(s)}
                        data-ocid={`suggestions.reject_button.${idx + 1}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {accepted.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Accepted ({accepted.length})
            </h2>
            <div className="space-y-2">
              {accepted.map((s, idx) => (
                <div
                  key={s.id.toString()}
                  className="bg-card border border-border rounded-lg p-3 flex gap-3 opacity-70"
                  data-ocid={`suggestions.accepted.item.${idx + 1}`}
                >
                  <Check
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "oklch(0.6 0.12 140)" }}
                  />
                  <p className="text-sm">{s.suggestionText}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {rejected.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Rejected ({rejected.length})
            </h2>
            <div className="space-y-2">
              {rejected.map((s, idx) => (
                <div
                  key={s.id.toString()}
                  className="bg-card border border-border rounded-lg p-3 flex gap-3 opacity-40"
                  data-ocid={`suggestions.rejected.item.${idx + 1}`}
                >
                  <p className="text-sm line-through">{s.suggestionText}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
