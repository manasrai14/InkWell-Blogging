import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import PostCard from "../components/PostCard.jsx";

function formatDate(iso) {
  const d = new Date(iso + "Z");
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getProfile(username)
      .then((data) => setProfile(data.user))
      .catch((e) => setError(e.message));
    api
      .getFeed({ author: username })
      .then((data) => setPosts(data.posts))
      .catch(() => {});
  }, [username]);

  if (error) return <p className="error-text page">{error}</p>;
  if (!profile) return <p className="page-loading">Loading…</p>;

  return (
    <main className="page profile-page">
      <div className="profile-header">
        <h1 className="profile-name">{profile.username}</h1>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <p className="profile-meta">
          {profile.postCount} {profile.postCount === 1 ? "post" : "posts"} · joined{" "}
          {formatDate(profile.created_at)}
        </p>
      </div>

      <div className="feed-list">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts?.length === 0 && <p className="empty-state">No published posts yet.</p>}
      </div>
    </main>
  );
}
