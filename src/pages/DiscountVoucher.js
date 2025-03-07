import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

function DiscountVoucher() {
  const [discountCodes, setVouchers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 10; 
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const fetchVouchers = async () => {
    const querySnapshot = await getDocs(collection(db, "discountCodes"));
    const vouchers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setVouchers(vouchers);
    setFilteredVouchers(vouchers);
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = discountCodes.filter(
      (voucher) =>
        (voucher.code && voucher.code.toLowerCase().includes(query)) ||
        (voucher.phoneNumber && voucher.phoneNumber.toLowerCase().includes(query)) ||
        (voucher.vocType && voucher.vocType.toLowerCase().includes(query))
    );

    setFilteredVouchers(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredVouchers.length / vouchersPerPage);
  const currentVouchers = filteredVouchers.slice(
    (currentPage - 1) * vouchersPerPage,
    currentPage * vouchersPerPage
  );

  const handleImportClick = () => {
    console.log("Import button clicked!");
    setIsModalOpen(true);
  };
  
  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleImportSubmit = async () => {
    console.log("Submit button clicked!");
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const rows = text.split("\n").slice(1); // Skip header row
  
        for (let row of rows) {
          const [phoneNumber, price, customerName] = row.split(";").map((cell) => cell.trim());
          console.log({ phoneNumber, price, customerName, startDate, endDate });
  
          if (phoneNumber && price && customerName) {
            // Fungsi untuk generate kode unik
            const generateDocId = () => {
              const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
              const randomNumber = Math.floor(10 + Math.random() * 90); // 2 digit angka (10-99)
              const randomLetters = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join(""); // 4 huruf acak
              return `AV${randomNumber}${randomLetters}`;
            };
  
            const docId = generateDocId(); // Panggil fungsi untuk mendapatkan kode unik
  
            const data = {
              code: docId, // Simpan docId sebagai bagian dari data
              phoneNumber,
              price: parseFloat(price) || 0,
              customerName,
              startDate: new Date(startDate), // Pastikan format date benar
              endDate: new Date(endDate), // Pastikan format date benar
              status: "not used",
              vocType: "Tour voucher",
              createdAt: new Date(),
            };
  
            try {
              await setDoc(doc(db, "discountCodes", docId), data); // Gunakan docId yang sudah dipanggil
              console.log(`Voucher ${docId} berhasil diunggah.`);
            } catch (err) {
              console.error(`Gagal upload voucher ${docId}:`, err.message);
            }
          }
        }
  
        alert("Data berhasil diimport!");
        setIsModalOpen(false);
        
        if (typeof fetchVouchers === "function") {
          fetchVouchers(); // Pastikan fetchVouchers memang ada
        } else {
          console.warn("fetchVouchers is not defined.");
        }
      };
  
      reader.readAsText(csvFile);
    } catch (error) {
      console.error("Terjadi kesalahan saat mengupload data:", error.message);
      alert("Gagal upload data: " + error.message);
    }
  };  

  const exportDataToCSV = () => {
    const header = ["Kode Voucher", "Nama Customer", "Tipe", "Status", "Used Date"];
    const rows = discountCodes.map((voucher) => [
      voucher.code,
      voucher.phoneNumber,
      voucher.customerName,
      voucher.startDate,
      voucher.endDate,
      voucher.price,
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
      <h1 className="text-2xl font-bold">Discount Vouchers</h1>

      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Cari kode, nomor telepon, atau tipe..."
          value={searchQuery}
          onChange={handleSearch}
          className="border px-4 py-2 rounded flex-1"
        />

          <div className="flex space-x-2">
            <button
              onClick={handleImportClick}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Import CSV
            </button>
            <button
              onClick={exportDataToCSV}
              className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Export CSV
            </button>
          </div>
      </div>

        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="border border-gray-300 p-3">No</th>
              <th className="border border-gray-300 p-3">Code</th>
              <th className="border border-gray-300 p-3">Phone number</th>
              <th className="border border-gray-300 p-3">Customer</th>
              <th className="border border-gray-300 p-3">Type</th>
              <th className="border border-gray-300 p-3">Status</th>             
              <th className="border border-gray-300 p-3">Start Date</th>
              <th className="border border-gray-300 p-3">End Date</th>
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
                  <td className="border border-gray-300 p-3">{(currentPage - 1) * vouchersPerPage + index + 1}</td>
                  <td className="border border-gray-300 p-3">{voucher.code}</td>
                  <td className="border border-gray-300 p-3">{voucher.phoneNumber}</td>
                  <td className="border border-gray-300 p-3">{voucher.customerName}</td>
                  <td className="border border-gray-300 p-3">{voucher.vocType}</td>
                  <td className="border border-gray-300 p-3">{voucher.status}</td>
                  <td className="border border-gray-300 p-3">
                    {voucher.startDate? new Date(typeof voucher.startDate === "string"
                            ? voucher.startDate : voucher.startDate.toDate()).toLocaleDateString(): " "}
                  </td>
                  <td className="border border-gray-300 p-3">
                    {voucher.endDate? new Date(typeof voucher.endDate === "string"
                            ? voucher.endDate : voucher.endDate.toDate()).toLocaleDateString(): " "}
                  </td>
                  <td className="border border-gray-300 p-3">
                  {voucher.createdAt && voucher.createdAt.seconds
                      ? new Date(voucher.createdAt.seconds * 1000).toLocaleDateString()
                      : " "}
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

        {/* MODAL IMPORT */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg">
              <h2 className="text-xl font-bold mb-4">Import CSV</h2>
              <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full border px-2 py-1 rounded mb-2"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full border px-2 py-1 rounded mb-2"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-400 rounded">Cancel</button>
                <button onClick={handleImportSubmit} className="px-4 py-2 bg-blue-500 text-white rounded">Submit</button>
              </div>
            </div>
          </div>
        )}

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
