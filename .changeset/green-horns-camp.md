---
'outstatic': patch
---

- Serialize mixed-source media uploads so `media.json` updates do not race.
- Prevent media rebuilds from rewriting `media.json` when a configured source fails to load.
