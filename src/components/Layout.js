import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login"; // Cek apakah di halaman login

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect ke halaman login setelah logout
    } catch (error) {
      console.error("Logout gagal:", error.message);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar hanya ditampilkan jika bukan di halaman login */}
      {!isLoginPage && (
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
          <div className="p-4 text-lg font-bold border-b border-gray-700">
            CMS Dashboard
          </div>
          <nav className="flex-grow p-4">
            <ul className="space-y-4">
              <li>
                <Link to="/dashboard" className="block p-2 hover:bg-gray-700 rounded">
                  📊 Dashboard
                </Link>
              </li>
              <li>
                <Link to="/discount-voucher" className="block p-2 hover:bg-gray-700 rounded">
                  🎟️ Discount Vouchers
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left p-2 hover:bg-gray-700 rounded"
                >
                  🚪 Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <div className={`flex-grow p-6 bg-gray-100 overflow-auto ${isLoginPage ? "flex justify-center items-center" : ""}`}>
        <Outlet /> {/* Ini akan menampilkan halaman yang sedang dibuka */}
      </div>
    </div>
  );
};

export default Layout;
