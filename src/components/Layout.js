import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout gagal:", error.message);
    }
  };

  // Fungsi untuk menentukan judul halaman berdasarkan URL
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "📊 Dashboard";
      case "/discount-voucher":
        return "🎟️ Discount Vouchers";
      default:
        return "CMS Dashboard";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {!isLoginPage && (
        <aside className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="p-5 text-lg font-bold border-b border-gray-700 text-center">
            CMS Dashboard
          </div>
          <nav className="flex-grow p-4">
            <ul className="space-y-4">
              <li>
                <Link to="/dashboard" className="block p-3 rounded-lg hover:bg-gray-700">
                  📊 Dashboard
                </Link>
              </li>
              <li>
                <Link to="/discount-voucher" className="block p-3 rounded-lg hover:bg-gray-700">
                  🎟️ Discount Vouchers
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <div className={`flex-grow flex flex-col ${isLoginPage ? "justify-center items-center" : ""}`}>
        {/* Navbar di pojok kanan atas */}
        {!isLoginPage && (
          <div className="bg-white shadow-md flex justify-between items-center px-6 py-4">
            <h1 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h1>
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                    {user.displayName ? user.displayName[0] : "U"}
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-sm text-gray-500">Admin</p>
                  </div>
                </div>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Konten utama */}
        <div className="flex-grow p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
