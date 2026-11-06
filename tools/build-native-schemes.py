"""Build and reopen three independent SketchUp interiors from the supplied source model."""
import argparse,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);args=p.parse_args();root=Path(__file__).resolve().parents[1];args.output.mkdir(parents=True,exist_ok=True)
for scheme,name in [('earth','Mediterranean'),('chalk','Concrete Industrial'),('canopy','Modern Tropical')]:
 spec=args.output/'specs'/f'{scheme}.json';subprocess.run(['node',str(root/'tools/write-interior-spec.mjs'),scheme,str(spec.resolve())],cwd=root,check=True)
 subprocess.run([sys.executable,str(root/'tools/build_sketchup_interior.py'),str(args.source.resolve()),str((args.output/f'Veil of Light - {name}.skp').resolve()),'--spec',str(spec.resolve())],cwd=root,check=True)
 subprocess.run([sys.executable,str(root/'tools/export-sketchup-furniture.py'),str((args.output/f'Veil of Light - {name}.skp').resolve()),str(root/f'dist/assets/interiors/{scheme}.glb'),'--spec',str(spec.resolve())],cwd=root,check=True)

