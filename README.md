# Veil of Light · Fjäll Group

[Open the modern tropical villa](https://jplovensa.github.io/veil-of-light/)

A Three.js walkthrough of the supplied villa SketchUp model, furnished in a modern tropical palette: warm limewash, teak, woven cane, linen, travertine, olive accents, and tropical planting.

The full interior covers living, dining, kitchen, guest bedroom, guest bathroom, main bathroom, loft bedroom, loft study, entry, and rear terrace. Existing beds, sanitary fittings, appliances, arches, glazing, and the spiral stair are retained. The lounge seating and bathroom doors are redesigned; detached source-model objects are hidden. All four dining chairs face the table centre.

## Explore

Choose a room from **Explore a space**, then click to look around. Use WASD / arrow keys to walk, Shift to move faster, Q / E to change level, and Esc to pause. Pointer-lock browsers support mouse look; other browsers support dragging.

**Orbit** shows the whole villa. **Floor plan** and the adjustable cutaway reveal the layout. In floor-plan mode, double-click a floor to start walking there. **Moodboard** opens the material and atmosphere direction. Textures, site grid, snapshots, and fullscreen are available.

Desktop keyboard and mouse are recommended. Collision uses a forward ray test. Elevation is manual; this is an architectural explorer with no gravity or automatic stair climbing.

## Local preview

Run `python3 -m http.server 8765 --directory dist` and open http://localhost:8765.

All libraries, fonts, model assets, and the moodboard are bundled locally. The original geometry is in `dist/assets/villa.gltf`; `dist/interior-design.js` defines the shared furnishing geometry and placement. `dist/interior.js` renders those same design parts with procedural material textures and merged room geometry.

## Editable SketchUp output

The native interior builder creates named editable furniture and finish groups in a **new copy** of the original SketchUp file. It uses the same design specification as the live walkthrough, applies matching material colours and generated surface textures, and saves a verification report after reopening the exact output file. The source SKP is unchanged.

On macOS with SketchUp 2025 installed:

```sh
node tools/write-interior-spec.mjs
python3 tools/build_sketchup_interior.py /path/to/original.skp /path/to/Veil-of-Light-Modern-Tropical.skp
```

Use `--sdk` to specify another SketchUp C API library. The original and generated SKP files are not included in this repository. The local delivery contains the editable SKP and its verification report.

The older `convert_skp.py` / `package_model.py` tools regenerate the original shell export. The newer furnishing layer is rendered from the shared design specification.

## Checks and deployment

`node tools/validate-interior.mjs` checks the ten spaces, material references, finite geometry coordinates, and inward dining-chair directions. GitHub Actions checks the viewer and interior modules, then deploys `dist/` to GitHub Pages after every push to `main`.

## Moodboard and credits

The moodboard is an AI-generated atmosphere and material reference, created with the built-in image-generation tool. It is not an exact render of the villa. Its production prompt is in `docs/moodboard-prompt.txt`.

Three.js is distributed under the MIT License and Inter under the SIL Open Font License; their notices are in `dist/vendor/`. The Fjäll Group logo, villa design, and source model retain their respective owners' rights. No additional reuse licence is granted for the villa or branding by this repository.
