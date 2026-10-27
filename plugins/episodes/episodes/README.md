# episodes

The character's episodes are content, not code. This folder is empty on purpose: the plugin carries the tools
(`skills/episode`, `skills/gallery`) and the character (`character/`), never the videos.

Keep episodes wherever the content lives (a repo of their own, a shared drive). When the plugin is installed from a
marketplace it runs from a read-only cache, so don't put episodes here; point the scripts at your own folder.

Layout the scripts expect:
```
<episodes>/
  NN-slug/                 an episode (node skills/episode/scripts/new.mjs <episodes>/NN-slug)
  <series>/NN-slug/        or grouped one level down by series (the gallery shows the folder as the series)
  _gallery/                built by skills/gallery/scripts/gallery-data.mjs
```
Folders starting with `_` are ignored by the gallery. Don't commit `episode*.mp4`, `poster*.jpg` or `voice.mp3` to a code repo.
