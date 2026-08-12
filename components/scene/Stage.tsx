"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

/**
 * A small studio built out of light panels rather than an HDR file.
 *
 * The model arrives untextured, sharing one material across the whole
 * casting, so the only thing that can make it read as machined aluminium is
 * what it reflects. Building the environment from lightformers keeps that
 * reflection under our control and keeps the app free of any runtime asset
 * fetch — nothing here loads off a CDN.
 */
export function Stage({ radius }: { radius: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />

      {/* Key: high and slightly forward, throws the ground shadow. */}
      <directionalLight
        position={[4, 7, 5]}
        intensity={2.1}
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
      <directionalLight position={[-6, 2, -4]} intensity={0.65} color="#dce6ea" />

      <Environment resolution={256} frames={1}>
        {/* Overhead softbox — the long highlight down the top of the blower. */}
        <Lightformer
          form="rect"
          intensity={3.4}
          position={[0, 6, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 6, 1]}
          color="#ffffff"
        />
        {/* Two side panels give the cylindrical parts their edge highlights. */}
        <Lightformer
          form="rect"
          intensity={1.9}
          position={[7, 2, 3]}
          rotation={[0, -Math.PI / 2.4, 0]}
          scale={[7, 5, 1]}
          color="#eef4f6"
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          position={[-7, 1, -2]}
          rotation={[0, Math.PI / 2.4, 0]}
          scale={[7, 5, 1]}
          color="#dfe6e8"
        />
        {/* Warm bounce off the bench, so the underside is not dead grey. */}
        <Lightformer
          form="rect"
          intensity={0.85}
          position={[0, -4, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[9, 6, 1]}
          color="#f6f1e8"
        />
      </Environment>

      <ContactShadows
        position={[0, -radius * 0.86, 0]}
        opacity={0.5}
        scale={radius * 5}
        blur={2.4}
        far={radius * 2}
        resolution={1024}
        color="#2c332c"
        frames={1}
      />
    </>
  );
}
