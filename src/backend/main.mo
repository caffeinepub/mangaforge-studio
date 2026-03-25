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

  // Compare id for custom types
  module Project {
    public func compare(project1 : Project, project2 : Project) : Order.Order {
      Text.compare(project1.name, project2.name);
    };
  };

  module Book {
    public func compare(book1 : Book, book2 : Book) : Order.Order {
      Text.compare(book1.title, book2.title);
    };
  };

  module Chapter {
    public func compare(chapter1 : Chapter, chapter2 : Chapter) : Order.Order {
      Nat.compare(chapter1.orderIndex, chapter2.orderIndex);
    };
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

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // PROJECT CRUD
  public shared ({ caller }) func createProject(name : Text, description : Text) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };
    assertProjectOwnership(caller, name);
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access projects");
    };
    let project = getProjectInternal(id);
    shouldBeAdminOrOwner(project.owner, caller);
    project;
  };

  public shared ({ caller }) func deleteProject(id : Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };
    let project = getProjectInternal(id);
    shouldBeAdminOrOwner(project.owner, caller);
    projects.remove(id);

    // Delete all data associated with the project
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create characters");
    };
    let project = getProjectInternal(character.projectId);
    shouldBeAdminOrOwner(project.owner, caller);

    let id = generateId();
    let newCharacter = {
      character with
      createdAt = Time.now();
      appearanceDescription = "";
      portraitBlob = null;
    };
    characters.add(id, newCharacter);
    id;
  };

  public shared ({ caller }) func updateCharacter(id : Id, character : Character) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update characters");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete characters");
    };
    let character = getCharacterInternal(id);
    let project = getProjectInternal(character.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    characters.remove(id);
  };

  public query ({ caller }) func getCharacter(id : Id) : async Character {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access characters");
    };
    let character = getCharacterInternal(id);
    let project = getProjectInternal(character.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    character;
  };

  // BOOK CRUD
  public shared ({ caller }) func createBook(book : Book) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create books");
    };
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);

    let id = generateId();
    books.add(id, { book with createdAt = Time.now(); updatedAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateBook(id : Id, book : Book) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update books");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete books");
    };
    let book = getBookInternal(id);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    books.remove(id);
  };

  public query ({ caller }) func getBook(id : Id) : async Book {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access books");
    };
    let book = getBookInternal(id);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    book;
  };

  // CHAPTER CRUD
  public shared ({ caller }) func createChapter(chapter : Chapter) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create chapters");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update chapters");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete chapters");
    };
    let chapter = getChapterInternal(id);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    chapters.remove(id);
  };

  public query ({ caller }) func getChapter(id : Id) : async Chapter {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access chapters");
    };
    let chapter = getChapterInternal(id);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    chapter;
  };

  // COVER REFERENCE CRUD
  public shared ({ caller }) func createCoverReference(coverReference : CoverReference) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create cover references");
    };

    // Verify ownership through either chapter or book
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete cover references");
    };
    let coverRef = getCoverReferenceInternal(id);

    // Verify ownership through either chapter or book
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cover references");
    };
    let coverRef = getCoverReferenceInternal(id);

    // Verify ownership through either chapter or book
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create panels");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update panels");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete panels");
    };
    let panel = getPanelInternal(id);
    let chapter = getChapterInternal(panel.chapterId);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    panels.remove(id);
  };

  public query ({ caller }) func getPanel(id : Id) : async Panel {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access panels");
    };
    let panel = getPanelInternal(id);
    let chapter = getChapterInternal(panel.chapterId);
    let book = getBookInternal(chapter.bookId);
    let project = getProjectInternal(book.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    panel;
  };

  // SUGGESTION CRUD
  public shared ({ caller }) func createSuggestion(suggestion : Suggestion) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create suggestions");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update suggestions");
    };
    let existing = getSuggestionInternal(id);
    let project = getProjectInternal(existing.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    suggestions.add(id, { existing with status });
  };

  public shared ({ caller }) func deleteSuggestion(id : Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete suggestions");
    };
    let suggestion = getSuggestionInternal(id);
    let project = getProjectInternal(suggestion.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    suggestions.remove(id);
  };

  public query ({ caller }) func getSuggestion(id : Id) : async Suggestion {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access suggestions");
    };
    let suggestion = getSuggestionInternal(id);
    let project = getProjectInternal(suggestion.projectId);
    shouldBeAdminOrOwner(project.owner, caller);
    suggestion;
  };

  // FUNCTION TO GET ALL CHARACTERS FOR A PROJECT
  public query ({ caller }) func getCharactersForProject(projectId : ProjectId) : async [(Id, Character)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access characters");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access chapters");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access books");
    };
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

  // Gemini POST request logic
  func buildGeminiAuthorizationHeaders(apiKey : Text) : [Outcall.Header] {
    [
      { name = "Content-Type"; value = "application/json" },
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
    ];
  };

  func buildGeminiUrl(apiKey : Text) : Text {
    let baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-latest:generateContent";
    baseUrl # "?key=" # apiKey;
  };

  func executeGeminiPostRequest(url : Text, headers : [Outcall.Header], body : Text) : async Text {
    await Outcall.httpPostRequest(url, headers, body, transform);
  };

  public shared ({ caller }) func generateGeminiCompletion(apiKey : Text, body : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate AI completions");
    };
    let url = buildGeminiUrl(apiKey);
    let headers = buildGeminiAuthorizationHeaders(apiKey);
    let result = await executeGeminiPostRequest(url, headers, body);
    result;
  };

  // Fetch suggestions for a question, in streamed chunks (for streaming UI with full request body)
  public shared ({ caller }) func generateGeminiCompletionStreaming(apiKey : Text, body : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate AI completions");
    };
    let url = buildGeminiUrl(apiKey);
    let headers = buildGeminiAuthorizationHeaders(apiKey);
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
      Runtime.trap("You must be project owner/admin to access this project");
    };
  };

  func assertProjectOwnership(caller : Principal, projectName : Text) {
    if (caller.isAnonymous()) {
      Runtime.trap("Only registered users can create projects. Please log in or register to continue.");
    };
    if (projectName == "") {
      Runtime.trap("Project name cannot be empty. Please provide a valid name for your project.");
    };
  };

  // FETCH ALL PROJECTS
  public query ({ caller }) func getAllProjects() : async [(Id, Project)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access projects");
    };
    projects.entries().toArray().filter(
      func((_, project)) {
        project.owner == caller
      }
    );
  };

  // FETCH ALL PANELS FOR A CHAPTER
  public query ({ caller }) func getPanelsForChapter(chapterId : ChapterId) : async [(Id, Panel)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access panels");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cover references");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access suggestions");
    };
    let project = getProjectInternal(projectId);
    shouldBeAdminOrOwner(project.owner, caller);

    suggestions.entries().toArray().filter(
      func((_, suggestion)) {
        suggestion.projectId == projectId;
      }
    );
  };
};
