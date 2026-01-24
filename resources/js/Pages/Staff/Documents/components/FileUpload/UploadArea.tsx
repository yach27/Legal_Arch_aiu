import React from 'react';
import { Upload } from 'lucide-react';
import { UploadAreaProps } from '../../types/types';


const UploadArea: React.FC<UploadAreaProps> = ({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseFiles
}) => {
  return (
    <div
      className={`border-2 border-dashed rounded-lg px-8 py-12 text-center transition-all ${
    isDragging
      ? 'border-green-400 bg-green-50'
      : 'border-gray-300 bg-gray-50'
  }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Upload Icon */}
      <div className="mb-6">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-lg"></div>
          <Upload
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-gray-600"
            strokeWidth={2}
          />
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-900 mb-3 tracking-wide">
        DRAG AND DROP YOUR FILE HERE
      </p>
      <p className="text-sm text-gray-600 mb-6 font-medium">OR</p>

      <button
        onClick={onBrowseFiles}
        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors shadow-sm hover:shadow-md"
      >
        BROWSE FILES
      </button>
    </div>
  );
};

export default UploadArea;