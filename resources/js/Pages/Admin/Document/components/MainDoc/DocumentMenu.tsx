// DocumentMenu.tsx
import React from "react";
import { Edit, Trash2, Info } from "lucide-react";

interface DocumentMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onProperties: () => void;
}

const DocumentMenu: React.FC<DocumentMenuProps> = ({ onEdit, onDelete, onProperties }) => {
  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-[100]"
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="py-1 text-sm text-gray-700">
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onProperties)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            Properties
          </button>
        </li>
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onEdit)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </li>
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onDelete)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </li>
      </ul>
    </div>
  );
};

export default DocumentMenu;
