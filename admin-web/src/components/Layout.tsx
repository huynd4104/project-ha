import { NavLink, Outlet } from "react-router-dom";
import { resources } from "../api/adminApi";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Project HA</div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          {resources.map((item) => (
            <NavLink key={item.key} to={`/admin/${item.key}`}>{item.label}</NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <strong>{String(user?.fullName ?? "Admin")}</strong>
            <span>{String(user?.role ?? "")}</span>
          </div>
          <button onClick={logout}>Logout</button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
