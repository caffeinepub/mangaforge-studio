# MangaForge Studio

## Current State
Full-stack manga creation app with: project/book/chapter hierarchy, AI-powered assistance via Gemini API (HTTP outcalls), character creator with portrait upload, panel layout picker (25 layouts), suggestions tab, cover creation gate, AI clarify-and-enhance for vague panel descriptions.

Backend bug: `generateGeminiCompletion` was using deprecated model `gemini-1.0-pro-latest` and a wrong `Authorization: Bearer` header. FIXED in this pass: model changed to `gemini-1.5-flash`, header removed.

## Requested Changes (Diff)

### Add
1. **Dark Mode Toggle** - Header toggle that switches between light/dark themes persistently (localStorage)
2. **Panel Reordering** - Up/Down arrow buttons on panels in ChapterView to reorder panel sequence
3. **Chapter Thumbnail Strip** - Compact visual strip at top of ChapterView showing all panel layouts as small thumbnails with click-to-scroll
4. **Global Search** - Search bar in header (or dedicated modal) that searches across project names, character names, and chapter titles
5. **Project Tags/Genre Labels** - Tag chips on projects (e.g. action, romance, fantasy, sci-fi, horror). Shown on project card and editable in ProjectView
6. **Pinned Chapter Notes** - A sticky notes panel in ChapterView where users can pin freeform notes (stored in localStorage keyed by chapter ID)
7. **AI Chapter Title Suggestions** - Button in ChapterView/BookView that calls Gemini to suggest 5 creative chapter titles based on panel descriptions
8. **Mood/Tone Selector** - Per-chapter dropdown: Tense, Dramatic, Comedic, Melancholy, Action-packed, Mysterious, Romantic. Shown as colored badge. Stored in localStorage
9. **Story Arc Planner** - Timeline view in ProjectView showing all books and chapters in a horizontal scrollable timeline with chapter summaries
10. **Chapter Stats** - Word count estimate and panel count shown in ChapterView header area
11. **Speech Bubble Overlay Editor** - In panel view, a button to add text overlays (speech bubbles, narration boxes) shown as editable text boxes over the panel description. Stored in localStorage
12. **Quick Panel Templates** - Preset descriptions for common panel types (fight scene, conversation, establishing shot, emotional close-up, action panel) accessible from a dropdown when writing panel descriptions
13. **Project Completion Status** - Status badge on projects: Planning / In Progress / Complete. Editable from ProjectView. Stored in localStorage
14. **Panel Duplication** - Duplicate button on each panel that creates a copy below it in the same chapter
15. **API Key Validator** - After saving API key, immediately test it with a minimal Gemini call and show success/error toast. If invalid, keep the modal open with error message.

### 5 Big Features
16. **Full Storyboard View** - New tab/view showing all panels across all chapters in a visual grid. Each panel shows its layout SVG thumbnail + description excerpt. Accessible from a "Storyboard" button in BookView.
17. **In-App Panel Sketch Canvas** - Drawing canvas inside ChapterView for each panel. Uses HTML5 Canvas with basic brush, eraser, color picker, and clear tools. Sketches saved as base64 in localStorage.
18. **AI Scene-to-Panels Generator** - In ChapterView, a dialog where user describes a scene in natural language. AI (Gemini) breaks it down into 3-6 panel descriptions with layout suggestions. User can accept all or cherry-pick.
19. **Character Consistency Checker** - Button in CharactersView that sends all character descriptions to Gemini and returns a consistency report: flags contradictions, recommends visual consistency notes.
20. **Chapter PDF Export** - Export current chapter as a styled PDF using browser print API. Formats panel descriptions, layout names, character references, and notes into a clean printable document.

### Modify
- `ApiKeyModal`: After saving key, run a quick validation call (`callGemini` with a simple 1-word prompt). Show loading state. If Gemini returns an error, display it in the modal and don't close.
- `ChapterView`: Add thumbnail strip, stats bar, reorder buttons, duplicate button, sketch canvas per panel, AI title suggestions, mood selector, pinned notes panel
- `ProjectView`: Add tags, status badge, story arc timeline
- `Header`: Add global search icon/modal
- `BookView`: Add storyboard view button

### Remove
Nothing removed.

## Implementation Plan
1. Fix `ApiKeyModal` to validate key on save (Gemini test call)
2. Add dark mode context + toggle in Header
3. Implement panel reordering (move up/down) and duplication in ChapterView
4. Add chapter thumbnail strip at top of ChapterView
5. Add chapter stats (panel count + estimated word count)
6. Add mood/tone selector badge in ChapterView (localStorage)
7. Add pinned notes panel in ChapterView (localStorage)
8. Add quick panel templates dropdown in panel description field
9. Add speech bubble overlay editor per panel (localStorage)
10. Add project tags and status in ProjectView and ProjectsDashboard cards (localStorage)
11. Add story arc timeline in ProjectView
12. Add AI chapter title suggestions button
13. Add global search modal in Header
14. Add full storyboard view in BookView
15. Add panel sketch canvas per panel (HTML5 Canvas)
16. Add AI scene-to-panels generator dialog in ChapterView
17. Add character consistency checker in CharactersView
18. Add chapter PDF export button in ChapterView
