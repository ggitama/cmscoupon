import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function DiscountVoucher() {
  const [discountCodes, setVouchers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 10; // Jumlah voucher per halaman

  useEffect(() => {
    const fetchVouchers = async () => {
      const querySnapshot = await getDocs(collection(db, "discountCodes"));
      setVouchers(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchVouchers();
  }, []);

  // Hitung total halaman
  const totalPages = Math.ceil(discountCodes.length / vouchersPerPage);

  // Data yang akan ditampilkan di halaman saat ini
  const currentVouchers = discountCodes.slice(
    (currentPage - 1) * vouchersPerPage,
    currentPage * vouchersPerPage
  );

  // Fungsi untuk mengekspor data ke CSV
  const exportDataToCSV = () => {
    const header = ["Kode Voucher", "Nama Customer", "Tipe", "Status", "Used Date"];
    const rows = discountCodes.map((voucher) => [
      voucher.code,
      voucher.customerName,
      voucher.vocType,
      voucher.status,
      voucher.updatedAt ? new Date(voucher.updatedAt.seconds * 1000).toLocaleString() : "N/A",
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "discount_vouchers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Discount Vouchers</h1>
          <button
            onClick={exportDataToCSV}
            className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Export to CSV
          </button>
        </div>

        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="border border-gray-300 p-3">Code</th>
              <th className="border border-gray-300 p-3">Customer</th>
              <th className="border border-gray-300 p-3">Type</th>
              <th className="border border-gray-300 p-3">Status</th>
              <th className="border border-gray-300 p-3">Used Date</th>
            </tr>
          </thead>
          <tbody>
            {currentVouchers.length > 0 ? (
              currentVouchers.map((voucher, index) => (
                <tr
                  key={voucher.id}
                  className={`border-b ${index % 2 === 0 ? "bg-gray-100" : ""} hover:bg-gray-200`}
                >
                  <td className="border border-gray-300 p-3">{voucher.code}</td>
                  <td className="border border-gray-300 p-3">{voucher.customerName}</td>
                  <td className="border border-gray-300 p-3">{voucher.vocType}</td>
                  <td className="border border-gray-300 p-3">{voucher.status}</td>
                  <td className="border border-gray-300 p-3">
                    {voucher.updatedAt ? new Date(voucher.updatedAt.seconds * 1000).toLocaleString() : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-4">Tidak ada voucher tersedia.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${currentPage === 1 ? "bg-gray-300" : "bg-blue-500 hover:bg-blue-700 text-white"}`}
            >
              Previous
            </button>
            <span className="text-lg font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded ${currentPage === totalPages ? "bg-gray-300" : "bg-blue-500 hover:bg-blue-700 text-white"}`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscountVoucher;
