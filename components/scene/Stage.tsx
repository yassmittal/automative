"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

/**
 * A small studio built out of light panels rather than an HDR file.
 *
 * The model arrives untextured, sharing one material across the whole casting,
 * so what it reflects is the *only* thing that can give it either form or
 * colour. Panels of white light give it form and leave it looking like grey
 * putty; these are coloured for the same reason a photographer gels a studio —
 * a brass key down one flank and a cold blueprint rim down the other is what
 * makes bare aluminium read as a photographed casting rather than a clay
 * render.
 *
 * None of this encodes anything. The engine systems own the legend and the
 * balloons; this is lighting, and it is deliberately a warm/cool split rather
 * than anything a reader could mistake for a system hue.
 *
 * Building it from lightformers also keeps the app free of any runtime asset
 * fetch — nothing here loads off a CDN.
 */
export function Stage({ radius }: { radius: number }) {
  return (
    <>
      <ambientLight intensity={0.34} color="#dde8f2" />

      {/* Key: high and slightly forward, throws the ground shadow. Warm, so
          the lit flank separates from the cool fill on the other side. */}
      <directionalLight
        position={[4, 7, 5]}
        intensity={2.05}
        color="#fff3e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-radius * 1.6, radius * 1.6, radius * 1.6, -radius * 1.6, 0.1, 24]}
        />
      </directionalLight>

      {/* Fill from the opposite side so the shadowed flank keeps its form. */}
      <directionalLight position={[-6, 2, -4]} intensity={0.72} color="#a9cbe6" />

      <Environment resolution={256} frames={1}>
        {/* Overhead softbox — the long highlight down the top of the blower.
            Cool, like north light through a roof panel. */}
        <Lightformer
          form="rect"
          intensity={2.7}
          position={[0, 6, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 6, 1]}
          color="#e9f2ff"
        />
        {/* Brass key panel: the warm edge highlight down the near flank. */}
        <Lightformer
          form="rect"
          intensity={3.1}
          position={[7, 2, 3]}
          rotation={[0, -Math.PI / 2.4, 0]}
          scale={[7, 5, 1]}
          color="#ffc179"
        />
        {/* Blueprint-cold rim on the far flank, so every cylindrical part gets
            a warm edge on one side and a cold one on the other. */}
        <Lightformer
          form="rect"
          intensity={2.7}
          position={[-7, 1, -2]}
          rotation={[0, Math.PI / 2.4, 0]}
          scale={[7, 5, 1]}
          color="#63c3ec"
        />
        {/* A narrow anodised streak behind the engine — the kind of highlight
            that runs down a polished pipe and tells you it is metal. */}
        <Lightformer
          form="rect"
          intensity={1.7}
          position={[-1.5, 3.5, -6]}
          rotation={[0, Math.PI, 0]}
          scale={[6, 1.4, 1]}
          color="#b3a4f0"
        />
        {/* Two large, dim wrap panels. Without them every polished face
            reflects the black between the light panels and the casting reads
            as glass rather than alloy. */}
        <Lightformer
          form="rect"
          intensity={0.95}
          position={[0, 1, 9]}
          rotation={[0, 0, 0]}
          scale={[16, 12, 1]}
          color="#cfe2f2"
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          position={[0, 0, -9]}
          rotation={[0, Math.PI, 0]}
          scale={[16, 12, 1]}
          color="#f0dcc0"
        />
        {/* Warm bounce off the bench, so the underside is not dead grey. */}
        <Lightformer
          form="rect"
          intensity={1.35}
          position={[0, -4, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[9, 6, 1]}
          color="#ffe3b8"
        />
      </Environment>

      <ContactShadows
        position={[0, -radius * 0.86, 0]}
        opacity={0.46}
        scale={radius * 5}
        blur={2.4}
        far={radius * 2}
        resolution={1024}
        color="#2f3a49"
        frames={1}
      />
    </>
  );
}
