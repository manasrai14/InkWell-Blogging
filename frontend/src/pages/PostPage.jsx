import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { marked } from "marked";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(iso) {
  const d = new Date(iso + "Z");
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function PostPage() {
  const { slug } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState("");

  function load() {
    api
      .getPost(slug, token)
      .then((data) => setPost(data.post))
      .catch((e) => setError(e.message));
    api
      .getComments(slug)
      .then((data) => setComments(data.comments))
      .catch(() => {});
  }

  useEffect(load, [slug, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLike() {
    if (!token) return navigate("/login");
    const data = await api.toggleLike(slug, token);
    setPost((p) => ({ ...p, likedByViewer: data.liked, likeCount: data.likeCount }));
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!token) return navigate("/login");
    if (!commentBody.trim()) return;
    const data = await api.addComment(slug, commentBody, token);
    setComments((c) => [...c, data.comment]);
    setCommentBody("");
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    await api.deletePost(slug, token);
    navigate("/");
  }

  if (error) return <p className="error-text page">{error}</p>;
  if (!post) return <p className="page-loading">Loading…</p>;

  const isOwner = user?.username === post.author.username;

  return (
    <main className="page article-page">
      <article>
        <p className="eyebrow">{post.tags[0] || "Dispatch"}</p>
        <h1 className="article-title">{post.title}</h1>
        {post.subtitle && <p className="article-subtitle">{post.subtitle}</p>}

        <div className="article-byline">
          <Link to={`/@${post.author.username}`} className="byline">
            {post.author.username}
          </Link>
          <span className="dot">·</span>
          <time>{formatDate(post.created_at)}</time>
        </div>

        {isOwner && (
          <div className="article-owner-actions">
            <Link to={`/edit/${post.slug}`} className="btn btn-ghost btn-small">
              Edit
            </Link>
            <button className="btn btn-ghost btn-small btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}

        <div className="article-body" dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }} />

        <div className="article-tags">
          {post.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>

        <div className="article-actions">
          <button
            className={`like-button ${post.likedByViewer ? "like-button-active" : ""}`}
            onClick={handleLike}
          >
            ♥ {post.likeCount}
          </button>
        </div>
      </article>

      <section className="comments-section">
        <h2 className="comments-heading">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h2>

        <form className="comment-form" onSubmit={handleComment}>
          <textarea
            placeholder={token ? "Add to the conversation…" : "Sign in to leave a comment"}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            disabled={!token}
          />
          <button className="btn btn-primary btn-small" type="submit" disabled={!token}>
            Comment
          </button>
        </form>

        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-meta">
                <Link to={`/@${c.author.username}`} className="byline">
                  {c.author.username}
                </Link>
                <span className="dot">·</span>
                <time>{formatDate(c.created_at)}</time>
              </div>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
