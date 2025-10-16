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
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search documents, cases, agreements..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={handleFilterClick}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        type="button"
      >
        <Filter className="w-5 h-5 text-gray-500" />
        <span className="text-gray-700">Filter</span>
      </button>
    </div>
  );
};

export default SearchBar;