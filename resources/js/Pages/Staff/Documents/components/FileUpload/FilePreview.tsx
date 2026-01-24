import React from 'react';
import { FileText } from 'lucide-react';
import { FilePreviewProps } from '../../types/types';
import { formatFileSize } from '../../utils/fileUtils';


const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-10 bg-green-100 rounded-sm flex items-center justify-center">
            <FileText className="h-5 w-5 text-green-600" />
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