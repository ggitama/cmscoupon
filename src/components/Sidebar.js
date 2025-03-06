import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Menu</h2>
      <ul>
        <li className="mb-2">
          <Link to="/dashboard" className="block p-2 hover:bg-gray-700">Dashboard</Link>
        </li>
        <li>
          <Link to="/discount-voucher" className="block p-2 hover:bg-gray-700">Discount Voucher</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
