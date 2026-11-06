# Veil of Light · Fjäll Group

[Open the live explorer](https://jplovensa.github.io/veil-of-light/)

Interactive Three.js architectural explorer converted from the supplied `villa 2.skp`.

Run from this directory with `python3 -m http.server 8765 --directory dist`, then open http://localhost:8765.

- Orbit: drag, zoom, pan; double-click a surface to focus.
- Floor plan: top-down orthographic view with adjustable horizontal cutaway and wall-section outlines. Double-click a visible floor to start walking there.
- Walk through: starts at the original SketchUp camera. Click to activate, mouse look (or drag where pointer lock is unavailable), WASD / arrows to move, Shift to accelerate, Q / E to change elevation, Esc to pause.
- Textures, grid, snapshots, and fullscreen controls.

The original source file is unchanged. Geometry uses real SketchUp component instances, triangulated faces, material colours, opacity, texture coordinates, and 42 extracted textures. Hidden entities/layers are excluded. Textures are resized to at most 1024 px for browser use. World coordinates are converted from SketchUp inches / Z-up to metres / Y-up. The model extent is approximately 20.0 × 11.8 × 7.9 m.

Wall collision is a forward ray test; Q/E changes elevation manually. There is no gravity, automatic stair climbing, or full body physics. Desktop keyboard and mouse recommended. All viewer libraries, fonts, and model assets are bundled locally.

`tools/convert_skp.py` uses the installed SketchUp 2025 C API. `tools/package_model.py` splits geometry into browser assets and optimizes textures. Re-run both scripts to regenerate model assets.

## Deployment

GitHub Actions deploys `dist/` to GitHub Pages after each push to `main`. Set Settings → Pages → Source to GitHub Actions.

## Regenerating assets

On macOS with SketchUp installed: `python3 tools/convert_skp.py /path/to/model.skp`, then `python3 tools/package_model.py`. Use `--sdk` or `SKETCHUP_API_LIBRARY` to specify a different C API library. The source SKP is not included.

## Credits and rights

Three.js is distributed under the MIT License. Inter is distributed under the SIL Open Font License. Their licenses are included in `dist/vendor/`. The Fjäll Group logo, villa design, and model assets retain their respective owners’ rights. No additional reuse license is granted for the villa or branding by this repository.
