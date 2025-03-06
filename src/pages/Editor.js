import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const Editor = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleSave = async () => {
    await addDoc(collection(db, "articles"), {
      title,
      content,
      createdAt: serverTimestamp(),
    });
    navigate("/dashboard");
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl">Tambah Artikel</h2>
      <input type="text" placeholder="Judul" onChange={(e) => setTitle(e.target.value)} className="border p-2 w-full my-2" />
      <textarea placeholder="Isi artikel..." onChange={(e) => setContent(e.target.value)} className="border p-2 w-full my-2"></textarea>
      <button onClick={handleSave} className="bg-blue-500 text-white p-2">Simpan</button>
    </div>
  );
};

export default Editor;
