import { useAuth } from "../context/AuthContext";
import StudentShell from "./StudentShell";
import AdminShell from "./AdminShell";

// Dua dunia, dua wujud:
//  • santri → StudentShell (skin "play": tab bawah, tombol 3D, rasa aplikasi)
//  • staf   → AdminShell   (skin "work": rail, command palette, tabel rapat)
export default function DashboardLayout() {
  const { profile } = useAuth();
  if (profile?.role !== "santri") return <AdminShell />;
  return (
<StudentShell />
  );
}
