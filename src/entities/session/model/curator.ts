import type { Session } from "./types";

type CuratorSelf = NonNullable<Session["curator"]>;

export function isMainCurator(session: Session | undefined): boolean {
  return session?.curator?.isMain ?? false;
}

/** Зоны, доступные куратору прямо сейчас — своя плюс замещение, если активно. */
export function activeZones(curator: CuratorSelf | undefined): CuratorSelf["zone"][] {
  if (!curator) return [];
  if (curator.isMain) return ["en", "ru"];
  const zones: CuratorSelf["zone"][] = [];
  if (curator.zone) zones.push(curator.zone);
  if (curator.substitutionZone && curator.substitutionZone !== curator.zone) zones.push(curator.substitutionZone);
  return zones;
}
