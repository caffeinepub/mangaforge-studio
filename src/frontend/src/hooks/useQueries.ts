import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Book,
  Chapter,
  Character,
  CoverReference,
  Panel,
  Project,
  Suggestion,
} from "../backend";
import { registerId } from "../utils/idRegistry";
import { useActor } from "./useActor";

export type ProjectWithId = Project & { id: bigint };
export type BookWithId = Book & { id: bigint };
export type ChapterWithId = Chapter & { id: bigint };
export type CharacterWithId = Character & { id: bigint };
export type PanelWithId = Panel & { id: bigint };
export type SuggestionWithId = Suggestion & { id: bigint };
export type CoverReferenceWithId = CoverReference & { id: bigint };

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile({ name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useGetAllProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<ProjectWithId[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await actor.getAllProjects();
      return entries.map(([id, p]) => ({ ...p, id }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: { name: string; description: string }) => {
      if (!actor) throw new Error("Actor not available");
      const now = BigInt(Date.now()) * BigInt(1000000);
      const id = await actor.createProject(name, description);
      registerId("project", now, id);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useGetBooksForProject(projectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<BookWithId[]>({
    queryKey: ["books", projectId?.toString()],
    queryFn: async () => {
      if (!actor || !projectId) return [];
      const entries = await actor.getBooksForProject(projectId);
      return entries.map(([id, b]) => ({ ...b, id }));
    },
    enabled: !!actor && !isFetching && !!projectId,
  });
}

export function useCreateBook() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      synopsis,
      projectId,
    }: { title: string; synopsis: string; projectId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      const now = BigInt(Date.now()) * BigInt(1000000);
      const id = await actor.createBook({
        title,
        synopsis,
        projectId,
        createdAt: now,
        updatedAt: now,
      });
      registerId("book", now, id);
      return id;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["books", vars.projectId.toString()] }),
  });
}

export function useGetChaptersForBook(bookId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ChapterWithId[]>({
    queryKey: ["chapters", bookId?.toString()],
    queryFn: async () => {
      if (!actor || !bookId) return [];
      const entries = await actor.getChaptersForBook(bookId);
      return entries.map(([id, c]) => ({ ...c, id }));
    },
    enabled: !!actor && !isFetching && !!bookId,
  });
}

export function useCreateChapter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      synopsis,
      bookId,
      orderIndex,
    }: {
      title: string;
      synopsis: string;
      bookId: bigint;
      orderIndex: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const now = BigInt(Date.now()) * BigInt(1000000);
      const id = await actor.createChapter({
        title,
        synopsis,
        bookId,
        orderIndex: BigInt(orderIndex),
        hasCover: false,
        createdAt: now,
        updatedAt: now,
      });
      registerId("chapter", now, id);
      return id;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["chapters", vars.bookId.toString()] }),
  });
}

export function useUpdateChapter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, chapter }: { id: bigint; chapter: any }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateChapter(id, chapter);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chapters"] }),
  });
}

export function useGetCharactersForProject(projectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<CharacterWithId[]>({
    queryKey: ["characters", projectId?.toString()],
    queryFn: async () => {
      if (!actor || !projectId) return [];
      const entries = await actor.getCharactersForProject(projectId);
      return entries.map(([id, c]) => ({ ...c, id }));
    },
    enabled: !!actor && !isFetching && !!projectId,
  });
}

export function useCreateCharacter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      projectId,
      portraitBlob,
      appearanceDescription,
      powerDescription,
      reformedPowerDescription,
    }: {
      name: string;
      projectId: bigint;
      portraitBlob?: any;
      appearanceDescription: string;
      powerDescription: string;
      reformedPowerDescription: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const now = BigInt(Date.now()) * BigInt(1000000);
      const id = await actor.createCharacter({
        name,
        projectId,
        portraitBlob: portraitBlob ?? undefined,
        appearanceDescription,
        powerDescription,
        reformedPowerDescription,
        createdAt: now,
      });
      registerId("character", now, id);
      return id;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({
        queryKey: ["characters", vars.projectId.toString()],
      }),
  });
}

export function useUpdateCharacter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, character }: { id: bigint; character: any }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateCharacter(id, character);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["characters"] }),
  });
}

export function useGetPanelsForChapter(chapterId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PanelWithId[]>({
    queryKey: ["panels", chapterId?.toString()],
    queryFn: async () => {
      if (!actor || !chapterId) return [];
      const entries = await actor.getPanelsForChapter(chapterId);
      return entries.map(([id, p]) => ({ ...p, id }));
    },
    enabled: !!actor && !isFetching && !!chapterId,
  });
}

export function useCreatePanel() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chapterId,
      layoutId,
      description,
      orderIndex,
    }: {
      chapterId: bigint;
      layoutId: number;
      description: string;
      orderIndex: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const now = BigInt(Date.now()) * BigInt(1000000);
      const id = await actor.createPanel({
        chapterId,
        layoutId: BigInt(layoutId),
        description,
        content: "",
        orderIndex: BigInt(orderIndex),
        createdAt: now,
        updatedAt: now,
      });
      registerId("panel", now, id);
      return id;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["panels", vars.chapterId.toString()] }),
  });
}

export function useUpdatePanel() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, panel }: { id: bigint; panel: any }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePanel(id, panel);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panels"] }),
  });
}

export function useGetCoverReferences(bookId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<CoverReferenceWithId[]>({
    queryKey: ["coverRefs", bookId?.toString()],
    queryFn: async () => {
      if (!actor || !bookId) return [];
      const entries = await actor.getCoverReferencesForBook(bookId);
      return entries.map(([id, r]) => ({ ...r, id }));
    },
    enabled: !!actor && !isFetching && !!bookId,
  });
}

export function useCreateCoverReference() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blobId,
      description,
      bookId,
      chapterId,
    }: {
      blobId: any;
      description: string;
      bookId?: bigint;
      chapterId?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const now = BigInt(Date.now()) * BigInt(1000000);
      const id = await actor.createCoverReference({
        blobId,
        description,
        bookId: bookId ?? undefined,
        chapterId: chapterId ?? undefined,
        createdAt: now,
      });
      registerId("coverRef", now, id);
      return id;
    },
    onSuccess: (_, vars) => {
      if (vars.bookId)
        qc.invalidateQueries({
          queryKey: ["coverRefs", vars.bookId.toString()],
        });
    },
  });
}

export function useGetSuggestionsForProject(projectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<SuggestionWithId[]>({
    queryKey: ["suggestions", projectId?.toString()],
    queryFn: async () => {
      if (!actor || !projectId) return [];
      const entries = await actor.getSuggestionsForProject(projectId);
      return entries.map(([id, s]) => ({ ...s, id }));
    },
    enabled: !!actor && !isFetching && !!projectId,
  });
}

export function useCreateSuggestion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      targetType,
      targetId,
      suggestionText,
    }: {
      projectId: bigint;
      targetType: string;
      targetId: bigint;
      suggestionText: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const now = BigInt(Date.now()) * BigInt(1000000);
      const id = await actor.createSuggestion({
        projectId,
        targetType,
        targetId,
        suggestionText,
        status: "pending",
        createdAt: now,
      });
      registerId("suggestion", now, id);
      return id;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({
        queryKey: ["suggestions", vars.projectId.toString()],
      }),
  });
}

export function useUpdateSuggestionStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSuggestionStatus(id, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suggestions"] }),
  });
}
