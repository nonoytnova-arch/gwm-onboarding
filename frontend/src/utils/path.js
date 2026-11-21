// Minimal dot/bracket path get/set, e.g. getPath(obj, 'contacts.owner.name')
// or getPath(obj, 'vehicles.0.registrationNumber'). Avoids pulling in
// lodash just for this.

export function getPath(obj, path, fallback) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return fallback;
    current = current[part];
  }
  return current === undefined ? fallback : current;
}

export function setPath(obj, path, value) {
  const parts = path.split('.');
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = current[part];
    current[part] = Array.isArray(next) ? [...next] : typeof next === 'object' && next !== null ? { ...next } : {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return result;
}
