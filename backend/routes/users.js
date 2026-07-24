import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/:username", (req, res) => {
  const user = db
    .prepare("SELECT id, username, bio, created_at FROM users WHERE username = ?")
    .get(req.params.username);

  if (!user) return res.status(404).json({ error: "No writer with that username." });

  const postCount = db
    .prepare("SELECT COUNT(*) c FROM posts WHERE author_id = ? AND published = 1")
    .get(user.id).c;

  res.json({ user: { ...user, postCount } });
});

export default router;
