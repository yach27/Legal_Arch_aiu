// SearchBar.tsx - Search and filter component with TypeScript
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { SearchBarProps } from '../../types/types'; // Adjust the import path as necessary

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  onFilterClick 
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(event.target.value);
  };

  const handleFilterClick = (): void => {
    onFilterClick();
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1 relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search documents, cases, agreements..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-12 pr-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 font-normal"
        />
      </div>
      <button
        onClick={handleFilterClick}
        className="flex items-center gap-2 px-5 py-3 bg-white rounded-lg border border-gray-200 font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-50"
        type="button"
      >
        <Filter className="w-5 h-5 text-gray-600" />
        <span className="text-gray-700 font-medium">Filter</span>
      </button>
    </div>
  );
};

export default SearchBar;