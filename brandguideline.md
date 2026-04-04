const jmSolutionssPrompt = `
# Project Specification: JM Solutionss - Interactive Cognitive Environment

## 1. Project Vision
Build **JM Solutionss**, a high-performance study application designed to transform static documents into an interactive cognitive environment. The platform integrates a rich-text notebook, a contextual AI assistant, and a multi-format quiz engine powered by spaced repetition and "Failure-Persistence" algorithms.

---

## 2. Visual Identity & Brand (JM Style)
- **Logo & Primary Color:** JM Dark Blue (#2E3A8C).
- **Accent Color:** JM Light Blue (#4A5FD9).
- **Background:** JM Navy (#1A2254) for dark, premium surfaces.
- **Design Language:** Professional, corporate, ultra-dark, using Glassmorphism and 8px/12px border radiuses.

---

## 3. Workspace & Library Management
- **Collections (Folders):** Nested sub-folders with thematic icons (Brain, Book, Code, Flask) and custom colors.
- **Note Management:** Inline renaming, duplication, and deletion with confirmation. Drag-and-drop organization.
- **Navigation:** Collapsible sidebar (Expanded vs. Icon-only mode).
- **Global Search (Ctrl+K):** Real-time search across titles and internal note content.

---

## 4. The "JM Solutionss" Smart Editor
- **Rich-Text Engine:** Custom contentEditable implementation with 1.5s debounce auto-sync to localStorage.
- **Floating Toolbar:** Contextual menu on text selection (Bold, Italic, Underline, Links).
- **Block Types:** H1, H2, Lists, Quotes, Horizontal Rules.
- **"Notame" System:** Highlighting tool to attach persistent, editable sticky-note annotations to specific text fragments.
- **Table Models:** - *Classic:* Standard technical grid.
    - *Modern (Cards):* Transforms rows into a grid of interactive cards with hover effects.
- **Media Tools:** Image paste/drag support with alignment controls, width slider (10-100%), and Canvas-based Crop Tool.
- **Typography Popover:** Inter (Sans), Playfair (Serif), Source Code (Mono). Font size slider (12px-36px).

---

## 5. AI Assistant: JM Solutionss AI
- **Contextual Awareness:** The AI prioritizes the active note's content for answering queries.
- **Session Control:** "End Session" feature to archive current chats into a dedicated, manageable archive.
- **Smart Import:** Upload .docx/txt files for AI-driven document architecting (Auto-structuring into H1/H2).

---

## 6. Quiz Engine & Mastery Logic

### Exclusive: Reveal Mode Mechanics
- **Interaction:** Text is hidden and revealed word-by-word using **Keyboard Arrow Keys**.
- **Hacker Effect:** Random character cycling animation before settling on the correct word.
- **Audio Integration:** Support for audio clues that play during the reveal process.

### Question Formats
- **Multiple Choice & True/False:** High-contrast, interactive buttons.
- **Short Answer:** Manual input with synonym support and case-sensitivity toggle.
- **Matching & Ordering:** Dropdown selectors and up/down sequence controls.
- **Flashcards:** 3D flip animation (Concept vs. Definition).

### The Persistence Algorithm (Core Logic)
- **Fail-Safe Session:** The quiz session only ends when 100% accuracy is achieved.
- **Looping:** Incorrectly answered questions are re-inserted into the active queue immediately.
- **Persistent Registry:** Every failed attempt is stored in localStorage with a daily filter.
- **Reinforcement Session:** A dedicated "FALLOS REGISTRADOS [X]" button to start a quiz using *only* failed items. Cleanup occurs only after correct re-answers.

---

## 7. Performance & Analytics
- **Accuracy Ring:** SVG-based dynamic ring showing real-time session precision.
- **Technical Metrics:** Tracking of total session duration and "Average Time per Question".
- **Gamification:** 7-day activity nodes (Weekly Streak) and performance-based motivational feedback.

---

## 8. Technical Stack & Requirements
- **Framework:** Next.js 15 (App Router), React 19.
- **Styling:** Tailwind CSS + ShadCN UI / Radix UI.
- **Icons:** Lucide React.
- **Persistence:** LocalStorage (Offline-first approach).

---

## 9. IA Summary Focus
Rebuild JM Solutionss prioritizing the **Reveal Mode** word-by-word mechanics and the **Persistence Algorithm** where questions loop until mastery. The UI must be ultra-dark, professional, and follow the JM Solutionss corporate blue palette.
`;

console.log("JM Solutionss Project Document Initialized.");