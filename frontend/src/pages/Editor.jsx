import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { marked } from "marked";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Editor() {
  const { slug } = useParams();
  const isEditing = !!slug;
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  useEffect(() => {
    if (!isEditing) return;
    api
      .getPost(slug, token)
      .then((data) => {
        if (data.post.author.username !== user?.username) {
          navigate(`/post/${slug}`);
          return;
        }
        setTitle(data.post.title);
        setSubtitle(data.post.subtitle);
        setContent(data.post.content);
        setTagsInput(data.post.tags.join(", "));
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e, publish = true) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (isEditing) {
        const data = await api.updatePost(slug, { title, subtitle, content, tags, published: publish }, token);
        navigate(`/post/${data.post.slug}`);
      } else {
        const data = await api.createPost({ title, subtitle, content, tags, published: publish }, token);
        navigate(`/post/${data.post.slug}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <p className="page-loading">Loading draft…</p>;

  return (
    <main className="page editor-page">
      <p className="eyebrow">{isEditing ? "Editing" : "New dispatch"}</p>

      <form className="editor-form" onSubmit={(e) => handleSubmit(e, true)}>
        <input
          className="editor-title-input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="editor-subtitle-input"
          placeholder="Subtitle (optional)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />
        <input
          className="editor-tags-input"
          placeholder="Tags, comma separated (e.g. essays, travel)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <div className="editor-split">
          <textarea
            className="editor-textarea"
            placeholder="Write in Markdown…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <div className="editor-preview article-body" dangerouslySetInnerHTML={{ __html: marked.parse(content || "*Preview appears here*") }} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="editor-actions">
          <button type="button" className="btn btn-ghost" onClick={(e) => handleSubmit(e, false)} disabled={busy}>
            Save draft
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>
    </main>
  );
}
