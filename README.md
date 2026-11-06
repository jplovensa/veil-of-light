# Veil of Light · Fjäll Group

[Open the modern tropical villa](https://jplovensa.github.io/veil-of-light/)

A Three.js walkthrough of the supplied villa SketchUp model, furnished in a modern tropical palette: warm limewash, teak, woven cane, linen, travertine, olive accents, and tropical planting.

The full interior covers living, dining, kitchen, guest bedroom, guest bathroom, main bathroom, loft bedroom, loft study, entry, and rear terrace. Existing beds, sanitary fittings, appliances, arches, glazing, and the spiral stair are retained. The lounge seating is redesigned; original bathroom doors, door hardware and kitchen joinery are retained at their source transforms. Detached source-model objects are hidden. All four dining chairs face the table centre.

## Explore

Choose a room from **Explore a space**, then click to look around. Use WASD / arrow keys to walk, Shift to move faster, Q / E to change level, and Esc to pause. Pointer-lock browsers support mouse look; other browsers support dragging.

**Orbit** shows the whole villa. **Floor plan** and the adjustable cutaway reveal the layout. In floor-plan mode, double-click a floor to start walking there. **Moodboard** opens the material and atmosphere direction. Textures, site grid, snapshots, and fullscreen are available.

Desktop keyboard and mouse are recommended. Collision uses a forward ray test. Elevation is manual; this is an architectural explorer with no gravity or automatic stair climbing.


## Catalogue design schemes and layout editing

The viewer now applies the supplied **To Breathe - FG Signature Catalogue** boards for Veil of Light: Mediterranean (p. 19), Concrete Industrial (p. 20), and Modern Tropical (p. 21). Original board artwork is included in the Moodboard dialog. Exterior finishes use the catalogue’s warm beige / terracotta sheet (p. 15) or white / charcoal sheet (p. 18). The architectural geometry, door assemblies and built-in kitchen joinery stay at their original source positions. The PDF combines each original moodboard with an applied interior / exterior finish schedule.

Select a **Design scheme** to coordinate exterior stucco, roof, stone, metalwork, interior walls, timber, upholstery, accents and pendant finishes. Switch **Daylight**, **Golden hour**, or **Blue hour**; practical lamps and exterior lighting have their own on/off switch and level control. Lighting is illustrative, without a photometric specification.

Open **Furniture layout** and enable **Move furniture**. Drag a piece in the cutaway plan, or choose it from the list and use 15 cm movement / 15 degree rotation controls. Original beds are included. Undo, reset one piece, reset the whole layout and download a JSON layout are available. Changes save on the current device; they do not overwrite the SketchUp file. Simple room bounds and door / stair exclusion zones help retain access; this does not replace a coordinated clearance review.

`node tools/validate-experience.mjs` verifies the three catalogue schemes, 42 finish entries, lighting presets, bundled boards/PDF and original architectural-export checksum.

## Local preview

Run `python3 -m http.server 8765 --directory dist` and open http://localhost:8765.

All libraries, fonts, model assets, and the moodboard are bundled locally. The original geometry is in `dist/assets/villa.gltf`; `dist/interior-design.js` defines the shared furnishing geometry and placement. `dist/interior.js` renders those same design parts with photographed PBR materials, soft upholstery geometry, woven chair backs, shaped ceramics, and merged room geometry.

## Material and lighting refinement

Teak, ivory linen and limewash use bundled diffuse, normal and roughness maps. HDR environment lighting, warm directional daylight, contact shadows and edge smoothing give the furniture a more grounded appearance. The shared design includes sculpted teak/cane chairs, rounded seat cushions, curved foliage and hollow lathed ceramics. The live viewer remains a real-time Three.js scene.

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

The bundled teak veneer, rough linen, plastered wall and Kiara Interior HDR environment are CC0 assets from [Poly Haven](https://polyhaven.com/). Exact source URLs and authors are recorded in `dist/assets/realism/credits.json`. Run `python3 tools/fetch-realism-assets.py` to retrieve the source maps and rendering addons.

Three.js is distributed under the MIT License and Inter under the SIL Open Font License; their notices are in `dist/vendor/`. The Fjäll Group logo, villa design, and source model retain their respective owners' rights. No additional reuse licence is granted for the villa or branding by this repository.
