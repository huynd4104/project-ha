import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Navbar />
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
