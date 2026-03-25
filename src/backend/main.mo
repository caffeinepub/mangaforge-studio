import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import Storage "blob-storage/Storage";
import Outcall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  include MixinStorage();

  // Define types
  type Id = Nat;
  type ProjectId = Nat;
  type BookId = Nat;
  type ChapterId = Nat;

  type Project = {
    owner : Principal;
    name : Text;
    description : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type Character = {
    projectId : ProjectId;
    name : Text;
    appearanceDescription : Text;
    powerDescription : Text;
    reformedPowerDescription : Text;
    portraitBlob : ?Storage.ExternalBlob;
    createdAt : Time.Time;
  };

  type Book = {
    projectId : ProjectId;
    title : Text;
    synopsis : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type Chapter = {
    bookId : BookId;
    title : Text;
    synopsis : Text;
    orderIndex : Nat;
    hasCover : Bool;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type CoverReference = {
    chapterId : ?ChapterId;
    bookId : ?BookId;
    blobId : Storage.ExternalBlob;
    description : Text;
    createdAt : Time.Time;
  };

  type Panel = {
    chapterId : ChapterId;
    orderIndex : Nat;
    layoutId : Nat;
    description : Text;
    content : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type Suggestion = {
    projectId : ProjectId;
    targetType : Text;
    targetId : Id;
    suggestionText : Text;
    status : Text;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  let projects = Map.empty<Id, Project>();
  let characters = Map.empty<Id, Character>();
  let books = Map.empty<Id, Book>();
  let chapters = Map.empty<Id, Chapter>();
  let coverReferences = Map.empty<Id, CoverReference>();
  let panels = Map.empty<Id, Panel>();
  let suggestions = Map.empty<Id, Suggestion>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextId = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Generate unique ID
  func generateId() : Id {
    nextId += 1;
    nextId;
  };

  // Auto-register any authenticated caller as a user if not already registered.
  // This eliminates the deadlock where new users can't call any API because
  // they need to be registered first, but registration requires calling an API.
  func ensureRegistered(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be authenticated to use this feature");
    };
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) {}; // already registered, nothing to do
      case (null) {
        // Register as regular user
        accessControlState.userRoles.add(caller, #user);
      };
    };
  };

  func isAuthorized(caller : Principal) : Bool {
    ensureRegistered(caller);
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { return null };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be authenticated to save profile");
    };
    // Auto-register user on first profile save
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) {};
      case (null) {
        accessControlState.userRoles.add(caller, #user);
      };
    };
    userProfiles.add(caller, profile);
  };

  // PROJECT CRUD
  public shared ({ caller }) func createProject(name : Text, description : Text) : async Id {
    ignore isAuthorized(caller);
    if (caller.isAnonymous()) {
      Runtime.trap("Only registered users can create projects. Please log in.");
    };
    if (name == "") {
      Runtime.trap("Project name cannot be empty.");
    };
    let id = generateId();
    let project : Project = {
      owner = caller;
      name;
      description;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    projects.add(id, project);
    id;
  };

  public query ({ caller }) func getProject(id : Id) : async Project {
    ignore isAuthorized(caller);
    let project = getProjectInternal(id);
    shouldBeAdminOrOwner(project.owner, caller);
    project;
  };

  public shared ({ caller }) func deleteProject(id : Id) : async () {
    ignore isAuthorized(caller);
    let project = getProjectInternal(id);
    shouldBeAdminOrOwner(project.owner, caller);
    projects.remove(id);

    characters.keys().toArray().forEach(
      func(x) {
        switch (characters.get(x)) {
          case (?char) {
            if (char.projectId == id) {
              characters.remove(x);
            };
          };
          case (null) {};
        };
      }
    );
    books.keys().toArray().forEach(
      func(x) {
        switch (books.get(x)) {
          case (?book) {
            if (book.projectId == id) {
              books.remove(x);
            };
          };
          case (null) {};
        };
      }
    );
    suggestions.keys().toArray().forEach(
      func(x) {
        switch (suggestions.get(x)) {
          case (?suggestion) {
            if (suggestion.projectId == id) {
              suggestions.remove(x);
            };
          };
          case (null) {};
        };
      }
    );
  };

  public shared ({ caller }) func updateProject(id : Id, project : Project) : async () {
    ignore isAuthorized(caller);
    let projectData = getProjectInternal(id);
    shouldBeAdminOrOwner(projectData.owner, caller);
    let updatedProject = {
      projectData with
      name = project.name;
      description = project.description;
      updatedAt = Time.now();
    };
    projects.add(id, updatedProject);
  };

  // CHARACTER CRUD
  public shared ({ caller }) func createCharacter(character : Character) : async Id {
    ignore isAuthorized(caller);
    let project = getProjectInternal(character.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    let id = generateId();
    let newCharacter = {
      character with
      createdAt = Time.now();
    };
    characters.add(id, newCharacter);
    id;
  };

  public shared ({ caller }) func updateCharacter(id : Id, character : Character) : async () {
    ignore isAuthorized(caller);
    let charData = getCharacterInternal(id);
    let project = getProjectInternal(charData.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    let updatedCharacter = {
      charData with
      name = character.name;
      powerDescription = character.powerDescription;
      reformedPowerDescription = character.reformedPowerDescription;
      appearanceDescription = character.appearanceDescription;
      portraitBlob = character.portraitBlob;
    };
    characters.add(id, updatedCharacter);
  };

  public shared ({ caller }) func deleteCharacter(id : Id) : async () {
    ignore isAuthorized(caller);
    let character = getCharacterInternal(id);
    let project = getProjectInternal(character.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    characters.remove(id);
  };

  public query ({ caller }) func getCharacter(id : Id) : async Character {
    ignore isAuthorized(caller);
    let character = getCharacterInternal(id);
    let project = getProjectInternal(character.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    character;
  };

  // BOOK CRUD
  public shared ({ caller }) func createBook(book : Book) : async Id {
    ignore isAuthorized(caller);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    let id = generateId();
    books.add(id, { book with createdAt = Time.now(); updatedAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateBook(id : Id, book : Book) : async () {
    ignore isAuthorized(caller);
    let existing = getBookInternal(id);
    let project = getProjectInternal(existing.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    books.add(id, {
      book with
      createdAt = existing.createdAt;
      updatedAt = Time.now();
    });
  };

  public shared ({ caller }) func deleteBook(id : Id) : async () {
    ignore isAuthorized(caller);
    let book = getBookInternal(id);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    books.remove(id);
  };

  public query ({ caller }) func getBook(id : Id) : async Book {
    ignore isAuthorized(caller);
    let book = getBookInternal(id);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    book;
  };

  // CHAPTER CRUD
  public shared ({ caller }) func createChapter(chapter : Chapter) : async Id {
    ignore isAuthorized(caller);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    let id = generateId();
    chapters.add(
      id,
      {
        chapter with
        createdAt = Time.now();
        updatedAt = Time.now();
        hasCover = false;
      },
    );
    id;
  };

  public shared ({ caller }) func updateChapter(id : Id, chapter : Chapter) : async () {
    ignore isAuthorized(caller);
    let existing = getChapterInternal(id);
    let book = getBookInternal(existing.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    chapters.add(
      id,
      {
        chapter with
        createdAt = existing.createdAt;
        updatedAt = Time.now();
      },
    );
  };

  public shared ({ caller }) func deleteChapter(id : Id) : async () {
    ignore isAuthorized(caller);
    let chapter = getChapterInternal(id);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    chapters.remove(id);
  };

  public query ({ caller }) func getChapter(id : Id) : async Chapter {
    ignore isAuthorized(caller);
    let chapter = getChapterInternal(id);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    chapter;
  };

  // COVER REFERENCE CRUD
  public shared ({ caller }) func createCoverReference(coverReference : CoverReference) : async Id {
    ignore isAuthorized(caller);
    switch (coverReference.chapterId, coverReference.bookId) {
      case (?chapterId, _) {
        let chapter = getChapterInternal(chapterId);
        let book = getBookInternal(chapter.bookId);
        let project = getProjectInternal(book.projectId);
        shouldBeAdminOrOwner(project.owner, caller);
      };
      case (null, ?bookId) {
        let book = getBookInternal(bookId);
        let project = getProjectInternal(book.projectId);
        shouldBeAdminOrOwner(project.owner, caller);
      };
      case (null, null) {
        Runtime.trap("Cover reference must have either chapterId or bookId");
      };
    };
    let id = generateId();
    coverReferences.add(id, { coverReference with createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func deleteCoverReference(id : Id) : async () {
    ignore isAuthorized(caller);
    let coverRef = getCoverReferenceInternal(id);
    switch (coverRef.chapterId, coverRef.bookId) {
      case (?chapterId, _) {
        let chapter = getChapterInternal(chapterId);
        let book = getBookInternal(chapter.bookId);
        let project = getProjectInternal(book.projectId);
        shouldBeAdminOrOwner(project.owner, caller);
      };
      case (null, ?bookId) {
        let book = getBookInternal(bookId);
        let project = getProjectInternal(book.projectId);
        shouldBeAdminOrOwner(project.owner, caller);
      };
      case (null, null) {};
    };
    coverReferences.remove(id);
  };

  public query ({ caller }) func getCoverReference(id : Id) : async CoverReference {
    ignore isAuthorized(caller);
    let coverRef = getCoverReferenceInternal(id);
    switch (coverRef.chapterId, coverRef.bookId) {
      case (?chapterId, _) {
        let chapter = getChapterInternal(chapterId);
        let book = getBookInternal(chapter.bookId);
        let project = getProjectInternal(book.projectId);
        shouldBeAdminOrOwner(project.owner, caller);
      };
      case (null, ?bookId) {
        let book = getBookInternal(bookId);
        let project = getProjectInternal(book.projectId);
        shouldBeAdminOrOwner(project.owner, caller);
      };
      case (null, null) {};
    };
    coverRef;
  };

  // PANEL CRUD
  public shared ({ caller }) func createPanel(panel : Panel) : async Id {
    ignore isAuthorized(caller);
    let chapter = getChapterInternal(panel.chapterId);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    let id = generateId();
    panels.add(
      id,
      {
        panel with
        createdAt = Time.now();
        updatedAt = Time.now();
      },
    );
    id;
  };

  public shared ({ caller }) func updatePanel(id : Id, panel : Panel) : async () {
    ignore isAuthorized(caller);
    let existing = getPanelInternal(id);
    let chapter = getChapterInternal(existing.chapterId);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    panels.add(
      id,
      {
        panel with
        createdAt = existing.createdAt;
        updatedAt = Time.now();
      },
    );
  };

  public shared ({ caller }) func deletePanel(id : Id) : async () {
    ignore isAuthorized(caller);
    let panel = getPanelInternal(id);
    let chapter = getChapterInternal(panel.chapterId);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    panels.remove(id);
  };

  public query ({ caller }) func getPanel(id : Id) : async Panel {
    ignore isAuthorized(caller);
    let panel = getPanelInternal(id);
    let chapter = getChapterInternal(panel.chapterId);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    panel;
  };

  // SUGGESTION CRUD
  public shared ({ caller }) func createSuggestion(suggestion : Suggestion) : async Id {
    ignore isAuthorized(caller);
    let project = getProjectInternal(suggestion.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    let id = generateId();
    suggestions.add(
      id,
      {
        suggestion with
        createdAt = Time.now();
        status = "pending";
      },
    );
    id;
  };

  public shared ({ caller }) func updateSuggestionStatus(id : Id, status : Text) : async () {
    ignore isAuthorized(caller);
    let existing = getSuggestionInternal(id);
    let project = getProjectInternal(existing.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    suggestions.add(id, { existing with status });
  };

  public shared ({ caller }) func deleteSuggestion(id : Id) : async () {
    ignore isAuthorized(caller);
    let suggestion = getSuggestionInternal(id);
    let project = getProjectInternal(suggestion.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    suggestions.remove(id);
  };

  public query ({ caller }) func getSuggestion(id : Id) : async Suggestion {
    ignore isAuthorized(caller);
    let suggestion = getSuggestionInternal(id);
    let project = getProjectInternal(suggestion.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    suggestion;
  };

  // FUNCTION TO GET ALL CHARACTERS FOR A PROJECT
  public query ({ caller }) func getCharactersForProject(projectId : ProjectId) : async [(Id, Character)] {
    ignore isAuthorized(caller);
    let project = getProjectInternal(projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    characters.entries().toArray().filter(
      func((_, character)) {
        character.projectId == projectId
      }
    );
  };

  // FUNCTION TO GET ALL CHAPTERS FOR A BOOK
  public query ({ caller }) func getChaptersForBook(bookId : BookId) : async [(Id, Chapter)] {
    ignore isAuthorized(caller);
    let book = getBookInternal(bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    chapters.entries().toArray().filter(
      func((_, chapter)) {
        chapter.bookId == bookId
      }
    );
  };

  // FUNCTION TO GET ALL BOOKS FOR A PROJECT
  public query ({ caller }) func getBooksForProject(projectId : ProjectId) : async [(Id, Book)] {
    ignore isAuthorized(caller);
    let project = getProjectInternal(projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    books.entries().toArray().filter(
      func((_, book)) {
        book.projectId == projectId
      }
    );
  };

  // HTTP OUTCALLS
  public query ({ caller }) func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input);
  };

  func buildGeminiUrl(apiKey : Text) : Text {
    let baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    baseUrl # "?key=" # apiKey;
  };

  func executeGeminiPostRequest(url : Text, headers : [Outcall.Header], body : Text) : async Text {
    await Outcall.httpPostRequest(url, headers, body, transform);
  };

  public shared ({ caller }) func generateGeminiCompletion(apiKey : Text, body : Text) : async Text {
    ignore isAuthorized(caller);
    let url = buildGeminiUrl(apiKey);
    let headers : [Outcall.Header] = [
      { name = "Content-Type"; value = "application/json" },
    ];
    let result = await executeGeminiPostRequest(url, headers, body);
    result;
  };

  public shared ({ caller }) func generateGeminiCompletionStreaming(apiKey : Text, body : Text) : async Text {
    ignore isAuthorized(caller);
    let url = buildGeminiUrl(apiKey);
    let headers : [Outcall.Header] = [
      { name = "Content-Type"; value = "application/json" },
    ];
    await Outcall.httpPostRequest(url, headers, body, transform);
  };

  // INTERNAL DATA ACCESS
  func getById<T>(id : Id, store : Map.Map<Id, T>, typeDescription : Text) : T {
    switch (store.get(id)) {
      case (null) {
        Runtime.trap(typeDescription # " " # id.toText() # " not found");
      };
      case (?x) { x };
    };
  };

  func getProjectInternal(id : Id) : Project {
    getById(id, projects, "Project");
  };

  func getCharacterInternal(id : Id) : Character {
    getById(id, characters, "Character");
  };

  func getBookInternal(id : Id) : Book {
    getById(id, books, "Book");
  };

  func getChapterInternal(id : Id) : Chapter {
    getById(id, chapters, "Chapter");
  };

  func getCoverReferenceInternal(id : Id) : CoverReference {
    getById(id, coverReferences, "Cover reference");
  };

  func getPanelInternal(id : Id) : Panel {
    getById(id, panels, "Panel");
  };

  func getSuggestionInternal(id : Id) : Suggestion {
    getById(id, suggestions, "Suggestion");
  };

  func shouldBeAdminOrOwner(owner : Principal, caller : Principal) {
    if (not (AccessControl.isAdmin(accessControlState, caller) or (owner == caller))) {
      Runtime.trap("You must be project owner/admin to access this resource");
    };
  };

  // FETCH ALL PROJECTS
  public query ({ caller }) func getAllProjects() : async [(Id, Project)] {
    if (caller.isAnonymous()) { return [] };
    // Auto-register user if not in the system yet
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) {};
      case (null) {
        accessControlState.userRoles.add(caller, #user);
      };
    };
    projects.entries().toArray().filter(
      func((_, project)) {
        project.owner == caller
      }
    );
  };

  // FETCH ALL PANELS FOR A CHAPTER
  public query ({ caller }) func getPanelsForChapter(chapterId : ChapterId) : async [(Id, Panel)] {
    ignore isAuthorized(caller);
    let chapter = getChapterInternal(chapterId);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    panels.entries().toArray().filter(
      func((_, panel)) {
        panel.chapterId == chapterId;
      }
    );
  };

  // FETCH ALL COVER REFERENCES FOR A BOOK
  public query ({ caller }) func getCoverReferencesForBook(bookId : BookId) : async [(Id, CoverReference)] {
    ignore isAuthorized(caller);
    let book = getBookInternal(bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    coverReferences.entries().toArray().filter(
      func((_, reference)) {
        switch (reference.bookId) {
          case (?id) { id == bookId };
          case (null) { false };
        };
      }
    );
  };

  // FETCH ALL SUGGESTIONS FOR PROJECT
  public query ({ caller }) func getSuggestionsForProject(projectId : ProjectId) : async [(Id, Suggestion)] {
    ignore isAuthorized(caller);
    let project = getProjectInternal(projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    suggestions.entries().toArray().filter(
      func((_, suggestion)) {
        suggestion.projectId == projectId;
      }
    );
  };
};
