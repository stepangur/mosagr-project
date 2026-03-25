// Shared fetch helper for admin routes to attach bearer token
export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("admin_token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `API Error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null as any;
  }

  return response.json();
}
