import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, setDoc, doc, orderBy,query} from "firebase/firestore";
import { FaSearch, FaTimes, FaFilter } from "react-icons/fa";
import { CSVLink } from "react-csv";
import { getAuth } from "firebase/auth";

function DiscountVoucher() {
  const [discountCodes, setVouchers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 10; 
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchParams, setSearchParams] = useState({
    code: "",
    phoneNumber: "",
    customerName: "",
    vocType: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const fetchVouchers = async () => {
    try {
      const q = query(collection(db, "discountCodes"), orderBy("createdAt", "desc")); // Perbaikan di sini
      const querySnapshot = await getDocs(q);
      
      const vouchers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setVouchers(vouchers);
      setFilteredVouchers(vouchers);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

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
        const uploadedVouchers = [];

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

            uploadedVouchers.push(data); 
          }
        }
  
        alert("Data berhasil diimport!");
        setSubmittedData({ vouchers: uploadedVouchers, startDate, endDate });
        setCsvFile(null);
        setStartDate("");
        setEndDate("");
        setIsModalOpen(false);
        
        if (typeof fetchVouchers === "function") {
          fetchVouchers(); 
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
    if (!filteredVouchers || filteredVouchers.length === 0) {
      alert("Tidak ada data yang bisa diekspor!");
      return;
    }
  
    // Buat data CSV
    const header = ["Kode Voucher", "Nama Customer", "Nomor Telepon", "Tipe", "Status", "Tanggal"];
    const csvContent = [
      header,
      ...filteredVouchers.map((voucher) => [
        voucher.code,
        voucher.customerName || "-",
        voucher.phoneNumber || "-",
        voucher.vocType,
        voucher.status,
        voucher.date,
      ]),
    ]
      .map((row) => row.join(",")) // Gabungkan setiap kolom dengan koma
      .join("\n"); // Gabungkan setiap baris dengan newline
  
    // Buat file Blob untuk di-download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    // Buat link untuk download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vouchers_${searchParams.vocType || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }; 

  const handleFilterChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    // Ambil data vocType & status dari database
    const fetchFilterOptions = async () => {
      const snapshot = await getDocs(query(collection(db, "discountCodes")));
      const data = snapshot.docs.map(doc => doc.data());

      // Ambil hanya unique values dari vocType & status
      const uniqueVoucherTypes = Array.from(new Set(data.map(v => v.vocType).filter(Boolean)));
      const uniqueStatuses = Array.from(new Set(data.map(v => v.status).filter(Boolean)));

      setVoucherTypes(uniqueVoucherTypes);
      setStatuses(uniqueStatuses);
    };

    fetchFilterOptions();
  }, []);

  const applyFilters = () => {
    let filtered = discountCodes.filter((voucher) => {
      return (
        (searchParams.code ? voucher.code?.toLowerCase().includes(searchParams.code.toLowerCase()) : true) &&
        (searchParams.phoneNumber ? String(voucher.phoneNumber || "").includes(searchParams.phoneNumber) : true) &&
        (searchParams.customerName ? voucher.customerName?.toLowerCase().includes(searchParams.customerName.toLowerCase()) : true) &&
        (searchParams.vocType ? voucher.vocType?.toLowerCase() === searchParams.vocType.toLowerCase() : true) &&
        (searchParams.price ? parseFloat(voucher.price) === parseFloat(searchParams.price) : true) &&
        (searchParams.status ? voucher.status?.toLowerCase() === searchParams.status.toLowerCase() : true) &&
        (searchParams.startDate && Date.parse(voucher.startDate) 
          ? new Date(voucher.startDate).getTime() >= new Date(searchParams.startDate).getTime()
          : true) &&
        (searchParams.endDate && Date.parse(voucher.endDate)
          ? new Date(voucher.endDate).getTime() <= new Date(searchParams.endDate).getTime()
          : true)
      );
    });
  
    setFilteredVouchers(filtered);
  };  

  return (
    <div className="flex flex-col items-center p-6">
      <div className="w-full max-w-5xl">
        <div className="bg-white shadow-lg p-6 rounded-lg mb-6">
          {/* Bagian Header: Filter & Import/Export */}
          <div className="flex justify-between items-center mb-4">
            {/* Tombol Toggle Filter */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            >
              <FaFilter /> {showFilter ? "Tutup Filter" : "Tampilkan Filter"}
            </button>

            {/* Tombol Import & Export */}
            <div className="flex space-x-3">
              {currentUser?.email === "merchant@merch.com" && (
                <button
                  onClick={handleImportClick}
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Import CSV
                </button>
              )}
              <button
                onClick={exportDataToCSV}
                className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Form Filter */}
          {showFilter && (
            <div className="mt-4 animate-slide-down">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">🎟️ Filter Vouchers</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  name="code"
                  placeholder="🔍 Kode Voucher"
                  value={searchParams.code}
                  onChange={handleFilterChange}
                  className="border border-gray-300 px-4 py-2 rounded-lg focus:ring focus:ring-blue-300"
                />
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder="📞 Nomor Telepon"
                  value={searchParams.phoneNumber}
                  onChange={handleFilterChange}
                  className="border border-gray-300 px-4 py-2 rounded-lg focus:ring focus:ring-blue-300"
                />
                <input
                  type="text"
                  name="customerName"
                  placeholder="👤 Nama Customer"
                  value={searchParams.customerName}
                  onChange={handleFilterChange}
                  className="border border-gray-300 px-4 py-2 rounded-lg focus:ring focus:ring-blue-300"
                />

                {/* Dropdown Voucher Type */}
                <select
                  name="vocType"
                  value={searchParams.vocType}
                  onChange={handleFilterChange}
                  className="border border-gray-300 px-4 py-2 rounded-lg bg-white focus:ring focus:ring-blue-300"
                >
                  <option value="">🎟️ Pilih Tipe Voucher</option>
                  {voucherTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <input 
                  type="number" 
                  name="price"  // Tambahkan name agar bisa di-handle di onChange
                  value={searchParams.price}
                  onChange={handleFilterChange}
                  placeholder="💰 Masukkan Harga"
                  className="w-full border p-2 rounded-lg text-gray-700"
                  min="0"  // Mencegah input angka negatif
                />

                {/* Dropdown Status */}
                <select
                  name="status"
                  value={searchParams.status}
                  onChange={handleFilterChange}
                  className="border border-gray-300 px-4 py-2 rounded-lg bg-white focus:ring focus:ring-blue-300"
                >
                  <option value="">📌 Pilih Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                {/* Start Date */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">📅 Tanggal Mulai</label>
                  <input
                    type="date"
                    name="startDate"
                    value={searchParams.startDate}
                    onChange={handleFilterChange}
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring focus:ring-blue-300"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">📅 Tanggal Berakhir</label>
                  <input
                    type="date"
                    name="endDate"
                    value={searchParams.endDate}
                    onChange={handleFilterChange}
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Tombol Filter */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={applyFilters}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition"
                >
                  <FaSearch /> Terapkan Filter
                </button>
                <button
                  onClick={() => {
                    setSearchParams({
                      code: "",
                      phoneNumber: "",
                      customerName: "",
                      vocType: "",
                      price: "",
                      status: "",
                      startDate: "",
                      endDate: "",
                    });
                    fetchVouchers(); // Reset data voucher
                  }}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg transition"
                >
                  <FaTimes /> Reset Filter
                </button>
              </div>
            </div>
          )}
        </div>

        <table className="w-full border-collapse">
        <thead>
            <tr className="bg-gray-200 text-left">
              <th className="border border-gray-300 p-3">No</th>
              <th className="border border-gray-300 p-3">Code</th>
              <th className="border border-gray-300 p-3">Phone number</th>
              <th className="border border-gray-300 p-3">Customer</th>
              <th className="border border-gray-300 p-3">Type</th>
              <th className="border border-gray-300 p-3">Price</th>
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
                  <td className="border border-gray-300 p-3">Rp {voucher.price.toLocaleString()}</td>
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
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
              {/* Header Modal */}
              <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700">Import CSV</h2>

              {/* Input File */}
              <label className="block font-medium text-gray-600 mb-1">Upload CSV:</label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                className="w-full border p-2 rounded-lg mb-4 cursor-pointer text-gray-700"
              />

              {/* Input Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-600 mb-1">Start Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border p-2 rounded-lg text-gray-700"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-600 mb-1">End Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border p-2 rounded-lg text-gray-700"
                  />
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition">
                  Cancel
                </button>
                <button 
                  onClick={handleImportSubmit} 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETAIL DATA */}
        {submittedData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg w-[600px]">
              <h2 className="text-xl font-bold mb-4">Detail Data Submitted</h2>

              {/* Tabel Data */}
              <div className="max-h-80 overflow-y-auto border rounded-lg">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-200 text-left">
                      <th className="p-2 border">No</th>
                      <th className="p-2 border">Kode</th>
                      <th className="p-2 border">Nama</th>
                      <th className="p-2 border">Harga</th>
                      <th className="p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedData.vouchers.length > 0 ? (
                      submittedData.vouchers.map((voucher, index) => (
                        <tr key={index} className="border hover:bg-gray-100">
                          <td className="p-2 border text-center">{index + 1}</td>
                          <td className="p-2 border">{voucher.code}</td>
                          <td className="p-2 border">{voucher.customerName}</td>
                          <td className="p-2 border">Rp {voucher.price.toLocaleString()}</td>
                          <td className="p-2 border text-center">
                            <span className={`px-2 py-1 rounded text-white ${voucher.status === "not used" ? "bg-red-500" : "bg-green-500"}`}>
                              {voucher.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center p-4 text-gray-500">Tidak ada data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tombol Download dan Close */}
              <div className="flex justify-between mt-4">
                <button onClick={() => setSubmittedData(null)} className="px-4 py-2 bg-gray-400 text-white rounded">Close</button>
                <CSVLink data={submittedData.vouchers} filename="discount_vouchers.csv">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded">Download CSV</button>
                </CSVLink>
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
