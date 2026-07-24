import { useEffect, useState } from "react";
import { api } from "../api.js";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { token } = useAuth();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getFeed({}, token)
      .then((data) => setPosts(data.posts))
      .catch((e) => setError(e.message));
  }, [token]);

  return (
    <main className="page feed-page">
      <div className="feed-intro">
        <p className="eyebrow">Latest dispatches</p>
        <h1 className="feed-heading">Stories worth setting in type.</h1>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!posts && !error && <p className="page-loading">Loading the feed…</p>}

      {posts && posts.length === 0 && (
        <div className="empty-state">
          <p>Nothing published yet. Be the first to write something.</p>
        </div>
      )}

      <div className="feed-list">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}
