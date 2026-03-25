# MangaForge Studio

## Current State
New project — no existing application files.

## Requested Changes (Diff)

### Add
- **Project hierarchy**: Project > Book > Chapter (enforced creation order)
- **Cover creation gate**: Before creating any chapter content, user must create a cover (upload reference images + description)
- **Reference image storage**: All uploaded reference images saved per project for consistency tracking
- **Character Creator**:
  - Upload profile/reference image → AI auto-describes physical appearance
  - Power description field with "Reform" button → AI expands power to deep, complex description
  - Characters saved per project, visible across all books/chapters
- **Panel layout picker**: 25 distinct manga panel layout templates when creating chapter panels (not covers)
- **AI content assistant**:
  - Suggests improvements to existing chapters/books
  - Suggests new content ideas
  - If user prompt is unclear, asks quick clarifying questions before proceeding
  - Adds creative enhancements automatically
  - No content restrictions on violence
- **Consistency engine**: When generating/editing, AI looks through all existing chapters, books, characters in the project to maintain visual/narrative consistency
- Authorization: user must log in to manage their projects
- Blob storage: images saved persistently (references, covers, character portraits)

### Modify
N/A (new project)

### Remove
N/A (new project)

## Implementation Plan
1. Backend: Projects, Books, Chapters, Characters, References data models with full CRUD. AI endpoints via HTTP outcalls for: character description, power reform, content suggestions, clarification Q&A.
2. Blob storage for reference images, cover images, character portraits.
3. Authorization so each user owns their projects.
4. Frontend: dashboard of projects, book/chapter tree navigation, cover creation form, character creator with AI auto-describe, panel layout picker (25 layouts), AI suggestion panel, reform button for powers.
