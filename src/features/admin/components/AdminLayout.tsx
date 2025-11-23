import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import { Toaster } from "@/components/ui/sonner"

const AdminLayout = () => (
  <div className="min-h-screen">
    <AdminNavbar />
    <main className="mx-auto">
      <Outlet />
    </main>
    <Toaster position='top-center' theme='light' className='text-gray-100'/>
  </div>
);

export default AdminLayout;
