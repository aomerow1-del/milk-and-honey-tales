---
trigger: always_on
---

# Milk & Honey Tales - Core Rules

- **Tech Stack:** Vanilla TypeScript, Vite, HTML5 Canvas. No heavy external gaming engines.
- **Architecture:** Modular, file-segregated architecture (core, entities, localization). 
- **Bilingual Constraint:** Every UI component, dialog box, and text render must explicitly support dual-direction layout (LTR for English, RTL for Hebrew). 
- **Rendering:** All drawable assets must go through a custom depth-sorting array sorted by $(x + y)$ tile coordinates before canvas rendering.