import { resources } from "../api/adminApi";

export function DashboardPage() {
  return (
    <section className="page">
      <h1>Dashboard</h1>
      <div className="resource-grid">
        {resources.map((resource) => (
          <a className="resource-tile" key={resource.key} href={`/admin/${resource.key}`}>
            <span>{resource.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
