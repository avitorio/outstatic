---
'outstatic': patch
---

- Add a Block Library for defining reusable MDX blocks and inserting them from the editor slash command.
- Add a copy button to MDX block code previews in the editor.
- Avoid marking documents as changed when existing MDX is normalized into custom blocks.
- Split the block editor dialog into a 3-step wizard (basics / props / additional attributes) and add an Additional Attributes field that appends a fixed string of JSX attributes to every inserted instance of the block.
- Fix blocks configured with Additional Attributes reopening as raw MDX instead of the editable block UI.
- Add block library icon picking support and update block metadata handling for JSX block insertion.
- Fix block library String attributes being HTML-escaped on save (e.g. `&` written as `&amp;` in URLs like YouTube embed links).
