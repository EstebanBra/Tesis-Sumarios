const BASE_URL = import.meta.env.VITE_API_URL as string;

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
