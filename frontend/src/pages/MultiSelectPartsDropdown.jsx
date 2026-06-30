import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search as SearchIcon, ChevronDown, Package } from 'lucide-react';

const MultiSelectPartsDropdown = ({ allParts, selectedParts, setSelectedParts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableParts = useMemo(() => {
    const selectedSet = new Set(Array.isArray(selectedParts) ? selectedParts : []);
    return allParts.filter(part => 
      !selectedSet.has(part) &&
      part.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allParts, selectedParts, searchTerm]);

  const togglePart = (part) => {
    setSelectedParts(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  const selectAll = () => {
    setSelectedParts(allParts);
  };

  const clearAll = () => {
    setSelectedParts([]); // Ensure this always sets to an empty array
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="w-full flex items-center flex-wrap gap-2 text-left theme-bg-card-soft border theme-border rounded-xl px-3 py-2 text-sm focus:outline-none focus-within:ring-2 focus-within:ring-cyan-500 theme-text transition-all min-h-[44px]"
        onClick={() => setIsOpen(true)}
      >
        <Package size={16} className="theme-cyan flex-shrink-0" />
        {(!Array.isArray(selectedParts) || selectedParts.length === 0) && <span className="theme-muted">Select parts...</span>}
        {Array.isArray(selectedParts) && selectedParts.map(part => (
          <span key={part} className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 text-xs font-medium px-2 py-1 rounded">
            {part}
            <button onClick={(e) => { e.stopPropagation(); togglePart(part); }} className="hover:text-white">
              <X size={14} />
            </button>
          </span>
        ))}
        <ChevronDown size={18} className={`theme-muted transition-transform flex-shrink-0 ml-auto ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-30 top-full mt-2 w-full theme-bg-card border theme-border rounded-xl shadow-lg backdrop-blur-md overflow-hidden animate-in fade-in-5 slide-in-from-top-2 duration-300">
          <div className="p-2">
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted" />
              <input
                type="text"
                placeholder="Search part number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 theme-bg-input border theme-border rounded-lg focus:outline-none focus:theme-cyan-border text-sm theme-text"
                autoFocus
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 pb-2 text-xs">
            <button onClick={selectAll} className="font-semibold text-cyan-400 hover:text-cyan-300">Select All</button>
            <button onClick={clearAll} className="font-semibold text-rose-400 hover:text-rose-300">Clear All</button>
          </div>
          <ul className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {availableParts.slice(0, 100).map(part => (
              <li 
                key={part}
                onClick={() => togglePart(part)}
                className="px-3 py-2 text-sm theme-text rounded-md cursor-pointer hover:bg-cyan-500 hover:text-black"
              >
                {part}
              </li>
            ))}
            {availableParts.length > 100 && (
              <li className="px-3 py-2 text-xs theme-muted text-center italic">
                Showing 100 of {availableParts.length} parts. Type to search...
              </li>
            )}
            {availableParts.length === 0 && searchTerm && (
              <li className="px-3 py-2 text-sm theme-muted text-center">No parts found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectPartsDropdown;