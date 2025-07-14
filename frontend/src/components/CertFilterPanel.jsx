import React, { useMemo } from 'react';

const CertFilterPanel = ({ filters, onFilterChange, allCerts }) => {
  const certNames = useMemo(() => [...new Set(allCerts.map(c => c.certName))].sort(), [allCerts]);

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">🔍 Filter Certifications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
        />
        <select
          value={filters.certName}
          onChange={(e) => onFilterChange({ certName: e.target.value })}
          className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white"
        >
          <option value="">All Certifications</option>
          {certNames.map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Month (1-12)"
          value={filters.month}
          onChange={(e) => onFilterChange({ month: e.target.value })}
          min="1"
          max="12"
          className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
        />
        <input
          type="number"
          placeholder="Year"
          value={filters.year}
          onChange={(e) => onFilterChange({ year: e.target.value })}
          min="1900"
          max={new Date().getFullYear() + 5}
          className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
        />
      </div>
    </div>
  );
};

export default CertFilterPanel;