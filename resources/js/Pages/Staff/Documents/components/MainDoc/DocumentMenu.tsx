// DocumentMenu.tsx
import React from "react";
import { Edit, Trash2, Info, Archive, RotateCcw } from "lucide-react";

interface DocumentMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onProperties: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  isArchived?: boolean;
}

const DocumentMenu: React.FC<DocumentMenuProps> = ({
  onEdit,
  onDelete,
  onProperties,
  onArchive,
  onRestore,
  isArchived = false
}) => {
  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="w-40 rounded-xl shadow-lg overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 10px 40px 0 rgba(100, 116, 139, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.3)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="py-1 text-sm">
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onProperties)}
            className="w-full text-left px-4 py-2 hover:bg-white/30 flex items-center gap-2 text-gray-900 hover:text-[#228B22] transition-all font-medium"
          >
            <Info className="w-4 h-4" />
            Properties
          </button>
        </li>

        {!isArchived && (
          <li>
            <button
              onClick={(e) => handleMenuClick(e, onEdit)}
              className="w-full text-left px-4 py-2 hover:bg-white/30 flex items-center gap-2 text-gray-900 hover:text-[#228B22] transition-all font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </li>
        )}

        {isArchived && onRestore && (
          <li>
            <button
              onClick={(e) => handleMenuClick(e, onRestore)}
              className="w-full text-left px-4 py-2 hover:bg-yellow-50 flex items-center gap-2 text-[#F4D03F] hover:text-[#FBEC5D] transition-all font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Restore
            </button>
          </li>
        )}

        {!isArchived && onArchive && (
          <li>
            <button
              onClick={(e) => handleMenuClick(e, onArchive)}
              className="w-full text-left px-4 py-2 hover:bg-orange-50 flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-all font-medium"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
          </li>
        )}

        <li>
          <button
            onClick={(e) => handleMenuClick(e, onDelete)}
            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center gap-2 transition-all font-medium"
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
