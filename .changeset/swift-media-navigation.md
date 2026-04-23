---
'outstatic': patch
---

- Add support for configuring multiple media sources with per-folder file type rules.
- Replace the media library delete icon with an actions menu that can delete files, open them on GitHub, or copy their output URL.
- Fix media source path validation and overlapping path resolution.
- Use ISO timestamps when rebuilding `media.json`.
- Fix document editor state when navigating between existing documents without unmounting.
- Fix singleton editors reloading stale content when navigating between entries.
- Guard the media library when no media sources are configured.
