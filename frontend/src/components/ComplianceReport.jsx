import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';

// Define roles and their mandatory certifications
// This ROLES_CONFIG should ideally be imported from a shared constants file or fetched from a backend
const ROLES_CONFIG = {
  'Consultant': ['Sales Cloud Consultant', 'Service Cloud Consultant', 'Platform App Builder'],
  'Analyst': ['Administrator', 'Platform Developer I', 'Data Cloud Consultant'],
  'Architect': ['Application Architect', 'System Architect', 'Identity and Access Management Architect'],
  'Developer': ['Platform Developer I', 'Platform Developer II', 'JavaScript Developer I'],
  'Admin': ['Administrator', 'Advanced Administrator'],
};

// Simulate loading PEP definition from a text file
const fetchPepDefinition = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return `PEP (Professional Excellence Program) Compliance is achieved when a user meets the following criteria:
  1. All mandatory certifications for their assigned role are completed.
  2. At least two certifications (any type) have been completed in the current selected year.
  Failure to meet either of these conditions results in a 'No' compliance status.`;
};


const ComplianceReport = ({ users, allCerts, rolesConfig }) => {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    role: '',
    year: currentYear,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  // State to manage visibility of date for all certification columns
  const [showAllCertDates, setShowAllCertDates] = useState(false); // Default to hide dates
  const [pepDefinition, setPepDefinition] = useState('');
  const [showPepDefinitionModal, setShowPepDefinitionModal] = useState(false);
  const pepModalRef = useRef(null);

  // Fetch PEP definition on component mount
  useEffect(() => {
    const loadPepDef = async () => {
      const definition = await fetchPepDefinition();
      setPepDefinition(definition);
    };
    loadPepDef();
  }, []);

  // Get all unique certification names from all users' certifications
  const allUniqueCertNames = useMemo(() => {
    const certs = new Set();
    allCerts.forEach(cert => certs.add(cert.certName));
    return Array.from(certs).sort();
  }, [allCerts]);

  // Process compliance data
  const complianceData = useMemo(() => {
    const processed = users
      .filter(user => filters.role === '' || user.role === filters.role) // Filter by selected role
      .map(user => {
        const userCerts = allCerts.filter(cert => cert.email === user.email);
        const mandatoryCertsForRole = rolesConfig[user.role] || [];

        // Dynamic Certification Columns (all unique certs)
        const certStatus = {};
        allUniqueCertNames.forEach(certName => {
          const foundCert = userCerts.find(uc => uc.certName === certName);
          if (foundCert) {
            certStatus[certName] = showAllCertDates
              ? `Yes (${new Date(foundCert.certDate).toLocaleDateString()})`
              : 'Yes';
          } else {
            certStatus[certName] = 'No';
          }
        });

        // 1. Check if all mandatory certifications for their role are completed
        let allMandatoryCompleted = true;
        if (mandatoryCertsForRole.length > 0) { // Only check if there are mandatory certs for the role
            mandatoryCertsForRole.forEach(mandatoryCert => {
                const foundMandatory = userCerts.some(uc => uc.certName === mandatoryCert);
                if (!foundMandatory) {
                    allMandatoryCompleted = false;
                }
            });
        } else {
            // If a role has no mandatory certs defined, consider this part of compliance met
            allMandatoryCompleted = true;
        }


        // 2. Check if at least two certifications have been completed in the current year
        const certsInCurrentYearList = userCerts.filter(uc =>
          uc.certDate && new Date(uc.certDate).getFullYear() === Number(filters.year)
        );
        const twoCertsCompletedCurrentYear = certsInCurrentYearList.length >= 2;

        // Final column: PEP Compliant
        const pepCompliant = allMandatoryCompleted && twoCertsCompletedCurrentYear;

        return {
          name: user.Name || 'N/A',
          email: user.email || 'N/A',
          role: user.role || 'N/A',
          ...certStatus, // Dynamically add all unique cert columns
          pepCompliant: pepCompliant ? 'Yes' : 'No',
          certsThisYear: certsInCurrentYearList.length, // New summary column
        };
      });

    // Apply sorting
    if (sortConfig.key !== null) {
      processed.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Custom sorting for Yes/No values (for cert columns and PEP Compliant)
        if (typeof aValue === 'string' && aValue.startsWith('Yes') && typeof bValue === 'string' && bValue.startsWith('No')) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (typeof aValue === 'string' && aValue.startsWith('No') && typeof bValue === 'string' && bValue.startsWith('Yes')) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }

        // Generic string/number comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return processed;
  }, [users, allCerts, filters.role, filters.year, rolesConfig, sortConfig, showAllCertDates, allUniqueCertNames]);

  // Handle filter changes for Compliance Report
  const handleComplianceFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Toggle all certification dates
  const handleToggleAllCertDates = useCallback(() => {
    setShowAllCertDates(prev => !prev);
  }, []);

  // Handle opening PEP Definition modal
  const openPepDefinitionModal = useCallback(() => {
    setShowPepDefinitionModal(true);
  }, []);

  // Handle closing PEP Definition modal
  const closePepDefinitionModal = useCallback(() => {
    setShowPepDefinitionModal(false);
  }, []);

  // Close PEP Definition modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pepModalRef.current && !pepModalRef.current.contains(event.target)) {
        closePepDefinitionModal();
      }
    };
    if (showPepDefinitionModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPepDefinitionModal, closePepDefinitionModal]);

  // Prepare data for CSV export for the Compliance Report
  const exportComplianceData = useCallback(() => {
    if (complianceData.length === 0) return;

    // Determine headers dynamically based on all unique certs and summary columns
    const baseHeaders = ["Name", "Email", "Role"];
    const dynamicCertHeaders = allUniqueCertNames;
    const summaryHeaders = ["PEP Compliant", "Certs This Year"];
    const finalHeaders = [...baseHeaders, ...dynamicCertHeaders, ...summaryHeaders];

    const rows = complianceData.map(row => {
      const baseRow = [row.name, row.email, row.role];
      const dynamicCertRow = allUniqueCertNames.map(certName => row[certName] || 'N/A');
      const summaryRow = [row.pepCompliant, row.certsThisYear];
      return [...baseRow, ...dynamicCertRow, ...summaryRow];
    });

    let csvContent = finalHeaders.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(e => `"${String(e).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "salesforce_compliance_report.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [complianceData, allUniqueCertNames]);

  // Request sort for compliance table
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator for compliance table
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  const availableRoles = useMemo(() => Object.keys(rolesConfig).sort(), [rolesConfig]);

  return (
    <div>
      {/* Compliance Report Filters */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">⚙️ Compliance Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <select
            value={filters.role}
            onChange={(e) => handleComplianceFilterChange({ role: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white"
          >
            <option value="">All Roles</option>
            {availableRoles.map((role, i) => (
              <option key={i} value={role}>{role}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Year for 2-Cert Rule"
            value={filters.year}
            onChange={(e) => handleComplianceFilterChange({ year: e.target.value })}
            min="1900"
            max={new Date().getFullYear() + 5}
            className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          />
          {/* Single toggle button for all certification dates */}
          <button
            onClick={handleToggleAllCertDates}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold shadow-md hover:bg-blue-600 transition duration-300 ease-in-out flex items-center justify-center"
          >
            {showAllCertDates ? 'Hide All Cert Dates' : 'Show All Cert Dates'}
          </button>
        </div>

        {/* PEP Definition Button */}
        <div className="flex justify-start mt-4">
          <button
            onClick={openPepDefinitionModal}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-600 transition duration-300 ease-in-out flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            What is PEP Compliant?
          </button>
        </div>
      </div>

      {/* Export Button for Compliance Report */}
      <div className="flex justify-end mb-4">
        <button
          onClick={exportComplianceData}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition duration-300 ease-in-out flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Compliance Report CSV
        </button>
      </div>

      {/* Compliance Report Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                  onClick={() => requestSort('name')}
                >
                  Name {getSortIndicator('name')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                  onClick={() => requestSort('email')}
                >
                  Email {getSortIndicator('email')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                  onClick={() => requestSort('role')}
                >
                  Role {getSortIndicator('role')}
                </th>
                {allUniqueCertNames.map((certName, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                    onClick={() => requestSort(certName)}
                  >
                    {certName} {getSortIndicator(certName)}
                  </th>
                ))}
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                  onClick={() => requestSort('pepCompliant')}
                >
                  PEP Compliant {getSortIndicator('pepCompliant')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
                  onClick={() => requestSort('certsThisYear')}
                >
                  Certs This Year {getSortIndicator('certsThisYear')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complianceData.length > 0 ? (
                complianceData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.role}</td>
                    {allUniqueCertNames.map((certName, i) => (
                      <td key={i} className={`px-6 py-4 whitespace-nowrap text-sm ${row[certName]?.startsWith('Yes') ? 'text-green-600' : 'text-red-600'}`}>
                        {row[certName] || 'N/A'}
                      </td>
                    ))}
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${row.pepCompliant === 'Yes' ? 'text-green-700' : 'text-red-700'}`}>
                      {row.pepCompliant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {row.certsThisYear}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3 + allUniqueCertNames.length + 2} className="px-6 py-4 text-center text-gray-500">
                    No compliance data found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PEP Definition Modal */}
      {showPepDefinitionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div ref={pepModalRef} className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-bold text-gray-800">PEP Compliant Definition</h4>
              <button
                onClick={closePepDefinitionModal}
                className="text-gray-500 hover:text-gray-700 transition duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-gray-700 whitespace-pre-wrap"> {/* whitespace-pre-wrap to respect newlines */}
              {pepDefinition}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closePepDefinitionModal}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceReport;