import axios from "axios";
import React, { useState, useEffect } from "react";

interface Category {
  category_id: number;
  category_name: string;
}

interface AddFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (folderName: string, categoryId: number) => void;
}

const AddFolderModal: React.FC<AddFolderModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [folderName, setFolderName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      axios
        .get("http://127.0.0.1:8000/api/categories", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })
        .then((res) => setCategories(res.data))
        .catch(() => setError("Failed to load categories"));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || !categoryId) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/folders",
        {
          folder_name: folderName,
          folder_path: `/uploads/${folderName}`, // backend will set actual path
          folder_type: "default",
          parent_folder_id: null,
          category_id: categoryId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Clear form and close modal
      setFolderName("");
      setCategoryId(null);
      onClose();

      // Call onCreate callback to refresh parent component
      if (onCreate) {
        onCreate(response.data.folder.folder_name, response.data.folder.category_id);
      }
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        setError(Object.values(errors).flat().join(" "));
      } else if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
      } else {
        setError("Failed to create folder. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 ml-64" style={{ marginLeft: '16rem' }}>
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-semibold text-gray-800">Create New Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="p-2 rounded bg-red-100 text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={loading || categories.length === 0}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-green-800 text-white hover:bg-green-900 transition disabled:bg-gray-400"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFolderModal;
