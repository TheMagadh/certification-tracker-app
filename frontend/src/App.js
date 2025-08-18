import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
// Import individual components
import CertFilterPanel from './components/CertFilterPanel';
import StatsOverview from './components/StatsOverview';
import UserTable from './components/UserTable';
import ComplianceReport from './components/ComplianceReport';
import AdvancedReports from './components/AdvancedReports';
import SelfServiceForm from './components/SelfServiceForm';

// Simulate loading PEP definition from a text file
// In a real application, you would fetch this from a static file server or CMS.
const fetchPepDefinition = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return `PEP (Professional Excellence Program) Compliance is achieved when a user meets the following criteria:
  1. All mandatory certifications for their assigned role are completed.
  2. At least two certifications (any type) have been completed in the current selected year.
  Failure to meet either of these conditions results in a 'No' compliance status.`;
};


// Main App Component
const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'compliance', 'advanced-reports', or 'self-service'
  const [rolesConfig, setRolesConfig] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    certName: '',
    month: '',
    year: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCertDetail, setSelectedCertDetail] = useState(null);
  const modalRef = useRef(null);

  // Function to load data from the API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const res = await fetch('http://localhost:4000/api/get-cache');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load data:", err);
      // In a real app, you might use a state variable to show an alert to the user
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to refresh data from the API
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const res = await fetch('http://localhost:4000/api/refresh-cache', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      await loadData(); // Reload data after refresh
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // Initial data load on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetch('http://localhost:4000/api/roles')
      .then(res => res.json())
      .then(setRolesConfig)
      .catch(() => {});
  }, []);

  // Handle filter changes for the Dashboard view
  const handleDashboardFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Flatten the nested certification data into a single array
  // This memoized function ensures it only re-runs if 'data' changes
  const allCerts = useMemo(() => {
    return data.flatMap(user =>
      (user.certifications || []).map(cert => ({
        email: user.email || 'N/A',
        name: 'N/A',
        city: 'N/A',
        state: 'N/A',
        country: 'N/A',
        certName: cert.name || 'N/A',
        certDate: cert.earnedAt || 'N/A',
        userId: user.email,
        role: user.role,
      }))
    );
  }, [data]);

  // Filter the certifications for the Dashboard based on current filter state
  const filteredDashboardCerts = useMemo(() => {
    return allCerts.filter(cert => {
      const matchesSearch = filters.search === '' ||
        cert.certName.toLowerCase().includes(filters.search.toLowerCase()) ||
        cert.email.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCert = filters.certName === '' ||
        cert.certName === filters.certName;

      let matchesDate = true;
      if (cert.certDate && (filters.month || filters.year)) {
        const certDateObj = new Date(cert.certDate);
        const certMonth = certDateObj.getMonth() + 1; // getMonth() is 0-indexed
        const certYear = certDateObj.getFullYear();

        const filterMonth = Number(filters.month);
        const filterYear = Number(filters.year);

        if (filters.month && filters.year) {
          matchesDate = certMonth === filterMonth && certYear === filterYear;
        } else if (filters.month) {
          matchesDate = certMonth === filterMonth;
        } else if (filters.year) {
          matchesDate = certYear === filterYear;
        }
      }
      return matchesSearch && matchesCert && matchesDate;
    });
  }, [allCerts, filters]);

  // Prepare data for CSV export for the Dashboard view
  const exportDashboardData = useCallback(() => {
    const headers = ["Email", "Name", "Certification", "Certification Date", "City", "State", "Country", "Role"];
    const rows = filteredDashboardCerts.map(cert => [
      cert.email,
      cert.name,
      cert.certName,
      cert.certDate,
      cert.city,
      cert.state,
      cert.country,
      cert.role
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(e => `"${String(e).replace(/"/g, '""')}"`).join(",") + "\n"; // Escape quotes
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "salesforce_certifications.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [filteredDashboardCerts]);

  // Handle opening the details modal
  const openDetailsModal = useCallback((cert) => {
    setSelectedCertDetail(cert);
    setShowDetailsModal(true);
  }, []);

  // Handle closing the details modal
  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedCertDetail(null);
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeDetailsModal();
      }
    };
    if (showDetailsModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetailsModal, closeDetailsModal]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased flex flex-col">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Salesforce Cert Dashboard
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-300
                ${currentView === 'dashboard' ? 'bg-blue-700 text-white shadow-inner' : 'text-blue-100 hover:text-white hover:bg-blue-700'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('compliance')}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-300
                ${currentView === 'compliance' ? 'bg-blue-700 text-white shadow-inner' : 'text-blue-100 hover:text-white hover:bg-blue-700'}`}
            >
              Compliance Report
            </button>
            <button
              onClick={() => setCurrentView('advanced-reports')}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-300
                ${currentView === 'advanced-reports' ? 'bg-blue-700 text-white shadow-inner' : 'text-blue-100 hover:text-white hover:bg-blue-700'}`}
            >
              Advanced Reports
            </button>
            <button
              onClick={() => setCurrentView('self-service')}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-300
                ${currentView === 'self-service' ? 'bg-blue-700 text-white shadow-inner' : 'text-blue-100 hover:text-white hover:bg-blue-700'}`}
            >
              Self Service
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container mx-auto p-6 flex-grow">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-800">
              {currentView === 'dashboard' && 'Certification Overview'}
              {currentView === 'compliance' && 'Role-Based Compliance Report'}
              {currentView === 'advanced-reports' && 'Advanced Certification Reports'}
                {currentView === 'self-service' && 'Self Service'}
            </h2>
            <button
              onClick={refreshData}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out
                ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'}`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  Refresh Data
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-600">
              <svg className="animate-bounce mx-auto h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 12v.622m15.356-2A8.001 8.001 0 0120 12v.622"></path>
              </svg>
              <p className="mt-4 text-lg">Loading certification data...</p>
            </div>
          ) : (
            currentView === 'dashboard' ? (
              <>
                {/* Stats Overview with Recharts */}
                <StatsOverview certs={allCerts} />

                {/* Filter Panel */}
                <CertFilterPanel filters={filters} onFilterChange={handleDashboardFilterChange} allCerts={allCerts} />

                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={exportDashboardData}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition duration-300 ease-in-out flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export to CSV
                  </button>
                </div>

                {/* User Table */}
                <UserTable certs={filteredDashboardCerts} openDetailsModal={openDetailsModal} />
              </>
            ) : currentView === 'compliance' ? (
              <ComplianceReport
                users={data} // Pass raw user data
                allCerts={allCerts} // Pass flattened cert data
                rolesConfig={rolesConfig}
              />
            ) : currentView === 'advanced-reports' ? (
              <AdvancedReports
                users={data}
                allCerts={allCerts}
              />
            ) : (
              <SelfServiceForm />
            )
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedCertDetail && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-bold text-gray-800">Details for {selectedCertDetail.name}</h4>
              <button
                onClick={closeDetailsModal}
                className="text-gray-500 hover:text-gray-700 transition duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-gray-700">
              <p><strong>Email:</strong> {selectedCertDetail.email}</p>
              <p><strong>Certification:</strong> {selectedCertDetail.certName}</p>
              <p><strong>Date:</strong> {selectedCertDetail.certDate ? new Date(selectedCertDetail.certDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>City:</strong> {selectedCertDetail.city}</p>
              <p><strong>State:</strong> {selectedCertDetail.state}</p>
              <p><strong>Country:</strong> {selectedCertDetail.country}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDetailsModal}
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
export default App;