import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface Panel {
    content: string;
    createdAt: Time;
    description: string;
    chapterId: ChapterId;
    layoutId: bigint;
    updatedAt: Time;
    orderIndex: bigint;
}
export interface Suggestion {
    status: string;
    suggestionText: string;
    createdAt: Time;
    projectId: ProjectId;
    targetType: string;
    targetId: Id;
}
export interface CoverReference {
    createdAt: Time;
    description: string;
    bookId?: BookId;
    chapterId?: ChapterId;
    blobId: ExternalBlob;
}
export interface Character {
    portraitBlob?: ExternalBlob;
    name: string;
    createdAt: Time;
    powerDescription: string;
    projectId: ProjectId;
    reformedPowerDescription: string;
    appearanceDescription: string;
}
export interface Chapter {
    title: string;
    createdAt: Time;
    bookId: BookId;
    updatedAt: Time;
    synopsis: string;
    hasCover: boolean;
    orderIndex: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type ChapterId = bigint;
export interface Book {
    title: string;
    createdAt: Time;
    updatedAt: Time;
    synopsis: string;
    projectId: ProjectId;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type Id = bigint;
export type ProjectId = bigint;
export type BookId = bigint;
export interface Project {
    owner: Principal;
    name: string;
    createdAt: Time;
    description: string;
    updatedAt: Time;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBook(book: Book): Promise<Id>;
    createChapter(chapter: Chapter): Promise<Id>;
    createCharacter(character: Character): Promise<Id>;
    createCoverReference(coverReference: CoverReference): Promise<Id>;
    createPanel(panel: Panel): Promise<Id>;
    createProject(name: string, description: string): Promise<Id>;
    createSuggestion(suggestion: Suggestion): Promise<Id>;
    deleteBook(id: Id): Promise<void>;
    deleteChapter(id: Id): Promise<void>;
    deleteCharacter(id: Id): Promise<void>;
    deleteCoverReference(id: Id): Promise<void>;
    deletePanel(id: Id): Promise<void>;
    deleteProject(id: Id): Promise<void>;
    deleteSuggestion(id: Id): Promise<void>;
    generateGeminiCompletion(apiKey: string, body: string): Promise<string>;
    generateGeminiCompletionStreaming(apiKey: string, body: string): Promise<string>;
    getAllProjects(): Promise<Array<[Id, Project]>>;
    getBook(id: Id): Promise<Book>;
    getBooksForProject(projectId: ProjectId): Promise<Array<[Id, Book]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChapter(id: Id): Promise<Chapter>;
    getChaptersForBook(bookId: BookId): Promise<Array<[Id, Chapter]>>;
    getCharacter(id: Id): Promise<Character>;
    getCharactersForProject(projectId: ProjectId): Promise<Array<[Id, Character]>>;
    getCoverReference(id: Id): Promise<CoverReference>;
    getCoverReferencesForBook(bookId: BookId): Promise<Array<[Id, CoverReference]>>;
    getPanel(id: Id): Promise<Panel>;
    getPanelsForChapter(chapterId: ChapterId): Promise<Array<[Id, Panel]>>;
    getProject(id: Id): Promise<Project>;
    getSuggestion(id: Id): Promise<Suggestion>;
    getSuggestionsForProject(projectId: ProjectId): Promise<Array<[Id, Suggestion]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBook(id: Id, book: Book): Promise<void>;
    updateChapter(id: Id, chapter: Chapter): Promise<void>;
    updateCharacter(id: Id, character: Character): Promise<void>;
    updatePanel(id: Id, panel: Panel): Promise<void>;
    updateProject(id: Id, project: Project): Promise<void>;
    updateSuggestionStatus(id: Id, status: string): Promise<void>;
}
