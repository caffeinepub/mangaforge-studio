import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, ShieldCheck, User, Wand2, Zap } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import { useAppContext } from "../../context/AppContext";
import { useActor } from "../../hooks/useActor";
import {
  type CharacterWithId,
  useCreateCharacter,
  useGetCharactersForProject,
  useUpdateCharacter,
} from "../../hooks/useQueries";
import { callGemini, fileToBase64 } from "../../utils/gemini";

function CharacterCreatorModal({
  projectId,
  character,
  onClose,
}: {
  projectId: bigint;
  character?: CharacterWithId;
  onClose: () => void;
}) {
  const { actor } = useActor();
  const { apiKey, setShowApiKeyModal } = useAppContext();
  const { mutateAsync: createChar, isPending: creating } = useCreateCharacter();
  const { mutateAsync: updateChar, isPending: updating } = useUpdateCharacter();
  const portraitInputId = useId();

  const [name, setName] = useState(character?.name ?? "");
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [appearance, setAppearance] = useState(
    character?.appearanceDescription ?? "",
  );
  const [power, setPower] = useState(character?.powerDescription ?? "");
  const [reformedPower, setReformedPower] = useState(
    character?.reformedPowerDescription ?? "",
  );
  const [genLoading, setGenLoading] = useState(false);
  const [reformLoading, setReformLoading] = useState(false);

  const handlePortraitSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortraitFile(file);
    setPortraitPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleGenerateDescription = async () => {
    if (!actor) return;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    if (!portraitFile) {
      toast.error("Upload a portrait first");
      return;
    }
    setGenLoading(true);
    try {
      const base64 = await fileToBase64(portraitFile);
      const prompt =
        "You are a manga character design expert. Describe this character's physical appearance in vivid detail for use as a consistency reference. Include: hair (color, style, length), eyes (color, shape), face structure, body type, height impression, skin tone, distinctive features, and any notable accessories or clothing. Be precise and detailed for art consistency. No preamble.";
      const result = await callGemini(
        actor,
        apiKey,
        prompt,
        base64,
        portraitFile.type,
      );
      setAppearance(result);
      toast.success("Description generated!");
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenLoading(false);
    }
  };

  const handleReformPower = async () => {
    if (!actor) return;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    if (!power.trim()) {
      toast.error("Enter a power description first");
      return;
    }
    setReformLoading(true);
    try {
      const prompt = `You are a fantasy/manga power system expert. Expand this power description into an extremely detailed, comprehensive breakdown:\n\n"${power}"\n\nInclude: exact mechanics and limitations, range and duration, power levels and stages, visual effects and manifestations, weaknesses and counters, lore and origin, interactions with other powers, and any creative extensions. Be thorough, creative, and specific. No content restrictions.`;
      const result = await callGemini(actor, apiKey, prompt);
      setReformedPower(result);
      toast.success("Power reformed!");
    } catch {
      toast.error("Reform failed");
    } finally {
      setReformLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      let blob: ExternalBlob | undefined;
      if (portraitFile) {
        const bytes = new Uint8Array(await portraitFile.arrayBuffer());
        blob = ExternalBlob.fromBytes(bytes);
      }
      if (character) {
        await updateChar({
          id: character.id,
          character: {
            ...character,
            name,
            portraitBlob: blob ?? character.portraitBlob,
            appearanceDescription: appearance,
            powerDescription: power,
            reformedPowerDescription: reformedPower,
          },
        });
      } else {
        await createChar({
          name,
          projectId,
          portraitBlob: blob,
          appearanceDescription: appearance,
          powerDescription: power,
          reformedPowerDescription: reformedPower,
        });
      }
      toast.success(character ? "Character updated!" : "Character created!");
      onClose();
    } catch {
      toast.error("Failed to save character");
    }
  };

  const isPending = creating || updating;
  const portraitSrc =
    portraitPreview ?? character?.portraitBlob?.getDirectURL() ?? null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        data-ocid="character.dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {character ? "Edit Character" : "New Character"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label htmlFor={portraitInputId}>Portrait</Label>
            <label
              htmlFor={portraitInputId}
              className="relative w-full aspect-square bg-muted rounded-lg border border-border overflow-hidden cursor-pointer hover:border-muted-foreground transition-colors block"
              data-ocid="character.portrait.upload_button"
            >
              {portraitSrc ? (
                <img
                  src={portraitSrc}
                  alt="portrait"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <User className="w-8 h-8" />
                  <span className="text-xs">Tap to upload portrait</span>
                </div>
              )}
              <input
                id={portraitInputId}
                type="file"
                accept="image/*"
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                onChange={handlePortraitSelect}
              />
            </label>
            <Button
              onClick={handleGenerateDescription}
              disabled={genLoading || !portraitFile}
              className="w-full"
              size="sm"
              data-ocid="character.generate_desc.button"
              style={{ background: "oklch(0.45 0.12 280)", color: "white" }}
            >
              {genLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 mr-1" />
              )}
              Generate Description
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Character Name</Label>
              <Input
                data-ocid="character.name.input"
                placeholder="Character name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Appearance Description</Label>
              <Textarea
                data-ocid="character.appearance.textarea"
                placeholder="Physical appearance details..."
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                className="bg-input border-border resize-none text-xs"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Power / Ability Description</Label>
            <Textarea
              data-ocid="character.power.textarea"
              placeholder='e.g. "Has Sans powers from Undertale"...'
              value={power}
              onChange={(e) => setPower(e.target.value)}
              className="bg-input border-border resize-none"
              rows={2}
            />
            <Button
              onClick={handleReformPower}
              disabled={reformLoading || !power.trim()}
              size="sm"
              data-ocid="character.reform_power.button"
              className="w-full"
              style={{
                background: "oklch(var(--red-brand) / 0.8)",
                color: "white",
              }}
            >
              {reformLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <Zap className="w-3.5 h-3.5 mr-1" />
              )}
              Reform Power (AI Expand)
            </Button>
          </div>

          {reformedPower && (
            <div className="space-y-1.5">
              <Label>Reformed Power Description</Label>
              <Textarea
                data-ocid="character.reformed_power.textarea"
                value={reformedPower}
                onChange={(e) => setReformedPower(e.target.value)}
                className="bg-input border-border resize-none text-xs"
                rows={5}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="character.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isPending}
            data-ocid="character.save_button"
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {character ? "Update" : "Create"} Character
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConsistencyCheckerDialog({
  characters,
  onClose,
}: {
  characters: CharacterWithId[];
  onClose: () => void;
}) {
  const { actor } = useActor();
  const { apiKey, setShowApiKeyModal } = useAppContext();
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    if (!actor || !apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setLoading(true);
    try {
      const charList = characters
        .map(
          (c) =>
            `Character: ${c.name}\nAppearance: ${c.appearanceDescription || "(none)"}\nPowers: ${c.powerDescription || "(none)"}\nReformed Powers: ${c.reformedPowerDescription || "(none)"}`,
        )
        .join("\n\n---\n\n");
      const prompt = `Review these manga character descriptions for consistency issues, contradictions, or ways to make them more visually distinct. Return a structured report with:\n1. Consistency Issues\n2. Contradictions Found\n3. Suggestions for Visual Distinctiveness\n4. Overall Assessment\n\nCharacters:\n${charList}`;
      const result = await callGemini(actor, apiKey, prompt);
      setReport(result);
    } catch {
      toast.error("Consistency check failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-2xl max-h-[85vh]"
        data-ocid="consistency.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck
              className="w-4 h-4"
              style={{ color: "oklch(var(--blue-action))" }}
            />
            Character Consistency Check
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!report && !loading && (
            <div className="text-center py-8">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                AI will review all {characters.length} characters for
                contradictions and consistency issues.
              </p>
              <Button
                onClick={runCheck}
                style={{
                  background: "oklch(var(--blue-action))",
                  color: "white",
                }}
                data-ocid="consistency.check.button"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Run Consistency Check
              </Button>
            </div>
          )}
          {loading && (
            <div
              className="flex items-center justify-center py-12"
              data-ocid="consistency.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-3" />
              <span className="text-sm text-muted-foreground">
                Analyzing characters...
              </span>
            </div>
          )}
          {report && (
            <ScrollArea className="max-h-96">
              <div
                className="bg-input rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed"
                data-ocid="consistency.success_state"
              >
                {report}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="consistency.close_button"
          >
            Close
          </Button>
          {report && (
            <Button
              onClick={runCheck}
              disabled={loading}
              variant="outline"
              data-ocid="consistency.recheck.button"
            >
              Re-check
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CharactersView() {
  const { selectedProjectId } = useAppContext();
  const { data: characters = [], isLoading } =
    useGetCharactersForProject(selectedProjectId);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CharacterWithId | null>(null);
  const [showConsistency, setShowConsistency] = useState(false);

  if (!selectedProjectId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div
          className="text-center"
          data-ocid="characters.no_project.empty_state"
        >
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select a project to manage characters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold">
              Characters
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create and manage your manga characters
            </p>
          </div>
          <div className="flex items-center gap-2">
            {characters.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConsistency(true)}
                data-ocid="characters.consistency_check.button"
              >
                <ShieldCheck className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Check Consistency</span>
              </Button>
            )}
            <Button
              data-ocid="characters.new_character.button"
              onClick={() => setCreating(true)}
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New </span>Character
            </Button>
          </div>
        </div>

        {isLoading && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            data-ocid="characters.loading_state"
          >
            {["sk-1", "sk-2", "sk-3"].map((k) => (
              <div
                key={k}
                className="h-40 bg-card rounded-lg border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && characters.length === 0 && (
          <div className="text-center py-16" data-ocid="characters.empty_state">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">No characters yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first character for this project
            </p>
            <Button
              onClick={() => setCreating(true)}
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
              data-ocid="characters.empty.new_character.button"
            >
              <Plus className="w-4 h-4 mr-2" /> Create First Character
            </Button>
          </div>
        )}

        {!isLoading && characters.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {characters.map((char, idx) => (
              <Card
                key={char.id.toString()}
                className="bg-card border-border hover:border-muted-foreground cursor-pointer transition-all"
                onClick={() => setEditing(char)}
                data-ocid={`characters.character.item.${idx + 1}`}
              >
                <CardHeader className="pb-2">
                  <Avatar className="w-16 h-16 mb-2">
                    {char.portraitBlob ? (
                      <AvatarImage src={char.portraitBlob.getDirectURL()} />
                    ) : null}
                    <AvatarFallback className="text-lg bg-muted">
                      {char.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-sm">{char.name}</CardTitle>
                </CardHeader>
                {(char.powerDescription || char.appearanceDescription) && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {char.powerDescription || char.appearanceDescription}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <CharacterCreatorModal
          projectId={selectedProjectId}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <CharacterCreatorModal
          projectId={selectedProjectId}
          character={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {showConsistency && (
        <ConsistencyCheckerDialog
          characters={characters}
          onClose={() => setShowConsistency(false)}
        />
      )}
    </div>
  );
}
