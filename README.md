# Veil of Light · Fjäll Group

[Explore the villa](https://jplovensa.github.io/veil-of-light/)

An interactive Three.js villa based on the supplied SketchUp architecture and the original To Breathe catalogue moodboards: Mediterranean (page 19), Concrete Industrial (page 20), and Modern Tropical (page 21). Each scheme has separately rebuilt furniture, joinery features and decor across eleven spaces, including a separate upper balcony. Sofas, chairs, tables, pendants, beds, vanities and shelving change in form and construction as well as colour.

Source bathroom door assemblies, hardware, built-in kitchen, sanitary fittings, glazing, arches and stair remain at their original positions. Original loose furniture is replaced. Four dining chairs face the table. These are coordinated visual design studies; source accuracy does not establish fabrication dimensions or product specifications.

## Explore and edit

Choose a space for an interior view. Orbit, floor plan, adjustable cutaway and walk modes are available. In walk mode use WASD, Shift for speed, Q/E for elevation and Esc to release the mouse. Elevation is manual; collision uses forward ray tests.

Choose a design scheme, then Daylight, Golden hour or Blue hour. Lamp brightness and on/off are independent. Open Moodboard to inspect the original proposal boards and finish schedules. Inter fonts and the transparent Fjäll Group logo are bundled.

Enable Move furniture under Furniture layout to drag pieces in plan, choose items, move by 15 cm or rotate by 15 degrees. Undo and reset controls are available. Each scheme saves a separate layout on the current device. Downloaded JSON records the layout; browser edits do not overwrite the SKP. Room bounds and door/stair exclusion zones assist layout planning and do not replace a detailed clearance review.

## Native SketchUp and lightweight delivery

The builder saves three independent SKP copies, reopens each through the SketchUp C API, verifies retained source-door transforms, and preserves the original file checksum. Named native furniture groups are exported from those exact saved files into separate GLBs. The optimized manifest records each native source checksum. The large editable SKP files are delivered locally and are not stored in this repository.

The browser downloads an optimized architectural shell and one interior at a time. Other schemes load when selected and the previous geometry is disposed. Meshopt compression, batched shell meshes, small shared texture maps, a 512 × 256 captured daylight environment and rendering only when the view changes keep the experience lighter. Photographed wood, fabric and mineral surface colour, normal and roughness maps provide material detail. Refined mode uses soft sun shadows, restrained contact shading and antialiasing, following Shelter of Sky. Lite mode omits post-processing and bedside shadow maps, caps pixel density and can be selected before startup with `?quality=lite`.

The initial screen is a small static preview. It appears before the 3D libraries load and includes a bounded loading watchdog, download timeouts, retry, and access to original moodboards if startup fails. WebGL context loss shows recovery instead of an endless loader. This improves resilience; browser/GPU failures cannot be ruled out entirely.

## Local preview and checks

Run `python3 -m http.server 8765 --directory dist`, then open http://localhost:8765.

Run `node tools/validate-interior.mjs` and `node tools/validate-experience.mjs`. These check all three schemes, eleven spaces, inward dining-chair directions, finite geometry, original architecture checksum, reference boards and release payload budgets.

On macOS with SketchUp 2025 installed, `python3 tools/build-native-schemes.py /path/to/original.skp /path/to/output` builds, reopens and exports the three native schemes. `node tools/optimize-viewer-models.mjs` compresses the browser models; build-time dependencies are documented in that file. `node tools/prepare-lightweight-surfaces.mjs` downsamples the captured environment. Deployment checks source modules and publishes `dist/` to GitHub Pages.

## Credits

Original architecture, catalogue boards and Fjäll identity were supplied by the user. Photograph-based CC0 material and HDR environment credits are in `dist/assets/realism/credits.json`. Three.js and meshoptimizer license notices are retained with the bundled libraries. An older generated atmosphere image is retained as an archive; the active Moodboard dialog uses original proposal pages.

## Proposal furniture refinement

The current furniture revision adds shaped loose upholstery with perimeter piping, relaxed cushions and draped throws. The tropical sofa uses a slim open teak/cane frame; Mediterranean seating uses an ivory upholstered base; the industrial scheme retains a grey L sectional. Dining chairs now have curved timber backs, tapered legs and separate seat cushions or cane panels. Ceramics have smoother hollow profiles, and books, trays and small plants are composed as grouped tabletop arrangements.

The work desk and chair are inside the enclosed loft, on the 2.95 m source floor. The rear balcony remains on its original 2.90 m floor and has a separate room view. Upper storage is beside the indoor work area, with the main aisle and glazing access kept clear. The exported layout has approximately 1.57 m between the work chair and bench and 0.28 m between the bench and bed. These measurements describe the model layout.

`tools/validate-upstairs.mjs` checks the actual optimized furniture exports against wood-floor triangles taken from the original architectural model. It also guards the indoor desk position and the study aisle and close bench-to-bed spacing. Its build-time dependencies are @gltf-transform/core@4.5.1, @gltf-transform/extensions@4.5.1 and meshoptimizer@1.3.0; set VEIL_OPTIMIZER_ROOT to their node_modules directory. GitHub Actions installs these only for validation. Each detailed interior stays below 3.3 MB and loads on demand; the architecture, small shared textures and renderer are reused.

## Shelter of Sky system refinement

The interface follows Shelter of Sky: bundled Inter, dark translucent panels, numbered room buttons, room captions, guided tour, Orbit/Walk/plan navigation and collection-aware snapshots. Veil retains its own original catalogue pages 19–21 and furniture editor. Bedside lamps have independent switches, room brightness, warmth and Reading/Relax/Sleep presets. Four newly modelled front/rear sliding glass leaves and two verified original bathroom door leaves animate with their hardware by sliding or rotating about source hinges; fixed glazing and frames remain fixed. The front glass wall follows the 4.40 m inner source arch (5.70 m apex); rear closure covers the ground floor beneath the existing outdoor balcony. This facade addition is a design proposal, not an original source assembly.

Both bedrooms in all three native schemes reuse the detailed bed geometry from the owner-supplied Shelter of Sky model. Draped duvet, mattress, headboard and loose pillows are preserved, fitted to Veil's existing bed footprints, with coordinated catalogue textiles. The build reduces that asset with a 3 mm geometric error allowance before native authoring. The browser exports still come from the exact reopened SKP copies. The living sofa is moved behind the actual main-bath partition face, leaving a visible gap, and the coffee table follows its revised position. This revision uses a new local-layout storage key so old saved sofa positions do not override the correction.

Catalogue surface maps preserve the original swatch colours, use restrained normal/roughness detail and follow physical furniture axes. Source geometry uses 45-degree creased normals before compression. Refined shading and Lite mode share the same architecture and furniture. The large editable native SKP files remain local; they are not browser startup downloads.
