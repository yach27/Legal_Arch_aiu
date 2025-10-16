import React from 'react';
import { FileText } from 'lucide-react';
import { FilePreviewProps } from '../../types/types';
import { formatFileSize } from '../../utils/fileUtils';


const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4 p-4 bg-white/30 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg">
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-10 bg-white/30 backdrop-blur-sm rounded-sm flex items-center justify-center shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-tight">
            {file.name}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;