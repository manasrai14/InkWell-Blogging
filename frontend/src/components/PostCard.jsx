import { Link } from "react-router-dom";

function formatDate(iso) {
  const d = new Date(iso + "Z");
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function excerpt(markdown, length = 160) {
  const plain = markdown
    .replace(/[#*_`>[\]]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > length ? plain.slice(0, length).trim() + "…" : plain;
}

export default function PostCard({ post }) {
  return (
    <article className="post-card">
      <div className="post-card-meta">
        <Link to={`/@${post.author.username}`} className="byline">
          {post.author.username}
        </Link>
        <span className="dot">·</span>
        <time>{formatDate(post.created_at)}</time>
      </div>

      <Link to={`/post/${post.slug}`} className="post-card-title-link">
        <h2 className="post-card-title">{post.title}</h2>
      </Link>

      {post.subtitle && <p className="post-card-subtitle">{post.subtitle}</p>}
      <p className="post-card-excerpt">{excerpt(post.content)}</p>

      <div className="post-card-footer">
        {post.tags.slice(0, 3).map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
        <span className="post-card-stats">
          {post.likeCount} {post.likeCount === 1 ? "like" : "likes"} · {post.commentCount}{" "}
          {post.commentCount === 1 ? "comment" : "comments"}
        </span>
      </div>
    </article>
  );
}
