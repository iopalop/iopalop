import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function authHeaders() {
  const token = await AsyncStorage.getItem("auth_token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export const api = {
  async get(path: string) {
    const res = await fetch(`${BASE}/api${path}`, { headers: await authHeaders() });
    if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
    return res.json();
  },
  async post(path: string, body: any) {
    const res = await fetch(`${BASE}/api${path}`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
    return res.json();
  },
  async put(path: string, body: any) {
    const res = await fetch(`${BASE}/api${path}`, {
      method: "PUT",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
    return res.json();
  },
  async del(path: string) {
    const res = await fetch(`${BASE}/api${path}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
    return res.json();
  },
};

export const BACKEND_URL = BASE;
