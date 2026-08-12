import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    // The 3D layer is deliberately imperative and these two rules assume it is
    // not. react-three-fiber's `useFrame` callback runs on the render loop,
    // outside React's render phase, and mutating material uniforms and shared
    // typed arrays in it is the supported way to animate — routing sixty
    // updates a second through state is the thing to avoid, not the fix.
    // The overlay is in here for the same reason: it is handed DOM refs by its
    // parent so the frame loop can move a label without re-rendering it.
    files: [
      "components/scene/**/*.{ts,tsx}",
      "components/ui/AnnotationOverlay.tsx",
    ],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
