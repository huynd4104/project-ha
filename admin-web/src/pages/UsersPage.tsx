import { CrudPage } from "./CrudPage";
export function UsersPage() {
  return <CrudPage title="Người dùng" path="/users" readonly fields={[]} columns={["email", "fullName", "role", "isActive"]} />;
}
