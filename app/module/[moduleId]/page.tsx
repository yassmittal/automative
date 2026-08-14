import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Atlas } from "@/components/Atlas";
import { findCatalogEntry, listModuleIds } from "@/lib/catalog";

type ModuleRouteProps = {
  params: Promise<{ moduleId: string }>;
};

/** The catalog is fixed at build time, so every plate is prerendered. */
export function generateStaticParams() {
  return listModuleIds().map((moduleId) => ({ moduleId }));
}

export async function generateMetadata({
  params,
}: ModuleRouteProps): Promise<Metadata> {
  const { moduleId } = await params;
  const entry = findCatalogEntry(moduleId);
  if (!entry) return {};

  return {
    title: entry.module.name,
    description: entry.module.blurb,
  };
}

export default async function ModulePage({ params }: ModuleRouteProps) {
  const { moduleId } = await params;
  const entry = findCatalogEntry(moduleId);
  if (!entry) notFound();

  return (
    <>
      {/* Start the model downloading alongside the JS bundle rather than
          waiting for React to hydrate and ask for it. */}
      <link
        rel="preload"
        href={entry.modelUrl}
        as="fetch"
        type="model/gltf-binary"
        crossOrigin="anonymous"
      />
      <Atlas entry={entry} />
    </>
  );
}
