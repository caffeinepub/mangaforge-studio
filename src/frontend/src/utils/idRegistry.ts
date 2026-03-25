const KEY = "mf_id_registry";

type Registry = Record<string, string>;

function getRegistry(): Registry {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRegistry(r: Registry) {
  localStorage.setItem(KEY, JSON.stringify(r));
}

export function registerId(type: string, createdAt: bigint, id: bigint) {
  const r = getRegistry();
  r[`${type}:${createdAt.toString()}`] = id.toString();
  saveRegistry(r);
}

export function lookupId(type: string, createdAt: bigint): bigint | null {
  const r = getRegistry();
  const v = r[`${type}:${createdAt.toString()}`];
  return v != null ? BigInt(v) : null;
}

export function withId<T extends { createdAt: bigint }>(
  type: string,
  items: T[],
): Array<T & { id: bigint }> {
  const results: Array<T & { id: bigint }> = [];
  for (const item of items) {
    const id = lookupId(type, item.createdAt);
    if (id != null) {
      results.push({ ...item, id });
    }
  }
  return results;
}
