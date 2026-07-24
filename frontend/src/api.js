const BASE = "/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Try again.");
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),

  getFeed: (params = {}, token) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/posts${qs ? `?${qs}` : ""}`, { token });
  },
  getPost: (slug, token) => request(`/posts/${slug}`, { token }),
  createPost: (payload, token) => request("/posts", { method: "POST", body: payload, token }),
  updatePost: (slug, payload, token) => request(`/posts/${slug}`, { method: "PUT", body: payload, token }),
  deletePost: (slug, token) => request(`/posts/${slug}`, { method: "DELETE", token }),
  toggleLike: (slug, token) => request(`/posts/${slug}/like`, { method: "POST", token }),

  getComments: (slug) => request(`/posts/${slug}/comments`),
  addComment: (slug, body, token) =>
    request(`/posts/${slug}/comments`, { method: "POST", body: { body }, token }),

  getProfile: (username) => request(`/users/${username}`),
};
