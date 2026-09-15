import { redirect } from "next/navigation";
import { isAdminAuthed } from "../../lib/adminGuard";
import AdminDashboard from "../../components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!isAdminAuthed()) {
    redirect("/admin/login");
  }
  return <AdminDashboard />;
}
