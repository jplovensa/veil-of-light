# Veil of Light · Fjäll Group

[Explore the villa](https://jplovensa.github.io/veil-of-light/)

An interactive Three.js villa based on the supplied SketchUp architecture and the original To Breathe catalogue moodboards: Mediterranean (page 19), Concrete Industrial (page 20), and Modern Tropical (page 21). Each scheme has separately rebuilt furniture, joinery features and decor across ten spaces. Sofas, chairs, tables, pendants, beds, vanities and shelving change in form and construction as well as colour.

Source bathroom door assemblies, hardware, built-in kitchen, sanitary fittings, glazing, arches and stair remain at their original positions. Original loose furniture is replaced. Four dining chairs face the table. These are coordinated visual design studies; source accuracy does not establish fabrication dimensions or product specifications.

## Explore and edit

Choose a space for an interior view. Orbit, floor plan, adjustable cutaway and walk modes are available. In walk mode use WASD, Shift for speed, Q/E for elevation and Esc to release the mouse. Elevation is manual; collision uses forward ray tests.

Choose a design scheme, then Daylight, Golden hour or Blue hour. Lamp brightness and on/off are independent. Open Moodboard to inspect the original proposal boards and finish schedules. Inter fonts and the transparent Fjäll Group logo are bundled.

Enable Move furniture under Furniture layout to drag pieces in plan, choose items, move by 15 cm or rotate by 15 degrees. Undo and reset controls are available. Each scheme saves a separate layout on the current device. Downloaded JSON records the layout; browser edits do not overwrite the SKP. Room bounds and door/stair exclusion zones assist layout planning and do not replace a detailed clearance review.

## Native SketchUp and lightweight delivery

The builder saves three independent SKP copies, reopens each through the SketchUp C API, verifies retained source-door transforms, and preserves the original file checksum. Named native furniture groups are exported from those exact saved files into separate GLBs. The optimized manifest records each native source checksum. The large editable SKP files are delivered locally and are not stored in this repository.

The browser downloads an optimized architectural shell and one interior at a time. Other schemes load when selected and the previous geometry is disposed. Meshopt compression, batched shell meshes, small shared texture maps, a 256 × 128 captured daylight environment and rendering only when the view changes keep the experience lighter. Photographed wood, fabric and mineral surface colour, normal and roughness maps provide material detail. Sun shadows and warm practical lights remain; heavy screen-space post-processing is omitted.

The initial screen is a small static preview. It appears before the 3D libraries load and includes a bounded loading watchdog, download timeouts, retry, and access to original moodboards if startup fails. WebGL context loss shows recovery instead of an endless loader. This improves resilience; browser/GPU failures cannot be ruled out entirely.

## Local preview and checks

Run `python3 -m http.server 8765 --directory dist`, then open http://localhost:8765.

Run `node tools/validate-interior.mjs` and `node tools/validate-experience.mjs`. These check all three schemes, ten spaces, inward dining-chair directions, finite geometry, original architecture checksum, reference boards and release payload budgets.

On macOS with SketchUp 2025 installed, `python3 tools/build-native-schemes.py /path/to/original.skp /path/to/output` builds, reopens and exports the three native schemes. `node tools/optimize-viewer-models.mjs` compresses the browser models; build-time dependencies are documented in that file. `node tools/prepare-lightweight-surfaces.mjs` downsamples the captured environment. Deployment checks source modules and publishes `dist/` to GitHub Pages.

## Credits

Original architecture, catalogue boards and Fjäll identity were supplied by the user. Photograph-based CC0 material and HDR environment credits are in `dist/assets/realism/credits.json`. Three.js and meshoptimizer license notices are retained with the bundled libraries. An older generated atmosphere image is retained as an archive; the active Moodboard dialog uses original proposal pages.
