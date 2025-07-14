import React, { useState, useMemo } from 'react';

const UserTable = ({ certs, openDetailsModal }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Function to sort data
  const sortedCerts = useMemo(() => {
    let sortableCerts = [...certs];
    if (sortConfig.key !== null) {
      sortableCerts.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === 'N/A' || bValue === 'N/A') {
          // Handle 'N/A' values by pushing them to the end
          if (aValue === 'N/A' && bValue !== 'N/A') return 1;
          if (aValue !== 'N/A' && bValue === 'N/A') return -1;
          return 0; // Both are 'N/A'
        }

        if (sortConfig.key === 'certDate') {
          // Date comparison
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          if (dateA < dateB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (dateA > dateB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          // String comparison
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
        // Fallback for other types or if values are not comparable
        return 0;
      });
    }
    return sortableCerts;
  }, [certs, sortConfig]);

  // Request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                onClick={() => requestSort('email')}
              >
                Email {getSortIndicator('email')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                onClick={() => requestSort('name')}
              >
                Name {getSortIndicator('name')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                onClick={() => requestSort('certName')}
              >
                Certification {getSortIndicator('certName')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                onClick={() => requestSort('certDate')}
              >
                Certification Date {getSortIndicator('certDate')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCerts.length > 0 ? (
              sortedCerts.map((cert, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cert.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cert.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cert.certName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {cert.certDate ? new Date(cert.certDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openDetailsModal(cert)}
                      className="text-blue-600 hover:text-blue-900 transition duration-300 px-3 py-1 rounded-md border border-blue-600 hover:border-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No certifications found matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;