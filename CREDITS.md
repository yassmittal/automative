# Credits

The 3D asset in this project is **licensed, not self-modelled**. What was built
here is the interactive layer around it: the callout system, the snapping and
occlusion logic, the camera work, the section cut, the quiz, and the content.

## 3D models

### Supercharged LS V8 Engine 1

| | |
| --- | --- |
| Author | UnforgettableName |
| Source | <https://sketchfab.com/3d-models/supercharged-ls-v8-engine-1-6e920e47959d4da797eff437beeaa3f3> |
| License | Sketchfab **Free Standard** |
| As downloaded | 77,038 triangles · 36,989 vertices · 5.56 MB GLB |
| As shipped | 76,820 triangles · one merged mesh · 810 KB GLB |

The Free Standard license permits use worldwide, on all types of media,
commercially or not, and in derivative works, under Sketchfab's basic
restrictions — which prohibit redistributing or reselling the model itself as a
standalone asset. This project embeds it inside an application rather than
offering it for download, which is within those terms.

License text: <https://sketchfab.com/licenses>

## What was changed about the asset

No modelling or sculpting was done. The source GLB was processed with
[`@gltf-transform/cli`](https://gltf-transform.dev):

```
gltf-transform optimize engine-raw.glb engine.glb \
  --compress meshopt --texture-compress false --simplify false
```

That pass deduplicates, flattens, and joins the model's 276 separate primitives
into a single mesh, then applies Meshopt compression and vertex quantisation —
5.56 MB down to 810 KB, and 276 draw calls down to one. No decimation was
needed; the poly count was already reasonable.

The model arrives untextured, with all 276 primitives sharing one material and
no part names. The aluminium look in the app is a `MeshStandardMaterial` applied
at runtime, lit by an environment built from `<Lightformer>` panels rather than
an HDR file — so the app fetches no third-party assets at runtime.

## Fonts

- **Archivo** and **IBM Plex Mono**, both served self-hosted via `next/font`
  (SIL Open Font License 1.1).
