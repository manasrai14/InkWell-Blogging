import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="masthead">
      <div className="masthead-inner">
        <Link to="/" className="wordmark">
          Inkwell
          <svg className="wordmark-rule" viewBox="0 0 220 12" aria-hidden="true">
            <path d="M2 8 C 40 2, 80 10, 120 5 S 200 2, 218 7" />
          </svg>
        </Link>

        <nav className="masthead-nav">
          {user ? (
            <>
              <Link to="/new" className="nav-link">
                Write
              </Link>
              <Link to={`/@${user.username}`} className="nav-link">
                @{user.username}
              </Link>
              <button
                className="nav-link nav-button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Sign in
              </Link>
              <Link to="/register" className="nav-link nav-cta">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
