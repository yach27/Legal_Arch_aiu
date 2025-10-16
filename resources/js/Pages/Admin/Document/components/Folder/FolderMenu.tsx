// FolderMenu.tsx
import React from "react";
import { Edit2, Trash2, Info } from "lucide-react";

interface FolderMenuProps {
  onRename: () => void;
  onDelete: () => void;
  onProperties: () => void;
}

const FolderMenu: React.FC<FolderMenuProps> = ({ onRename, onDelete, onProperties }) => {
  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50"
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
            onClick={(e) => handleMenuClick(e, onRename)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Rename
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

export default FolderMenu;
