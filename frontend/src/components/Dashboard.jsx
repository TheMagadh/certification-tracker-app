// src/components/Dashboard.js
import React, { useState } from 'react';
import UserTable from './UserTable';
import CertFilterPanel from './CertFilterPanel';
import StatsOverview from './StatsOverview';

function Dashboard({ data }) {
  const [filters, setFilters] = useState({
    search: '',
    certName: '',
    month: '',
    year: ''
  });

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const flattenCerts = () => {
    return data.flatMap(user => {
      return user.RelatedCertificationStatus?.records.map(cert => ({
        email: user.email,
        name: user.Name,
        city: user.City,
        state: user.State,
        country: user.Country,
        certName: cert.ExternalCertificationTypeName,
        certDate: cert.CertificationDate
      })) || [];
    });
  };

  const allCerts = flattenCerts();
  const filtered = allCerts.filter(cert => {
    const matchesSearch = filters.search === '' ||
      cert.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      cert.email.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCert = filters.certName === '' ||
      cert.certName === filters.certName;
    const matchesDate = (!filters.month && !filters.year) ||
      new Date(cert.certDate).getMonth() + 1 === Number(filters.month) &&
      new Date(cert.certDate).getFullYear() === Number(filters.year);

    return matchesSearch && matchesCert && matchesDate;
  });

  return (
    <div>
      <StatsOverview certs={allCerts} />
      <CertFilterPanel filters={filters} onFilterChange={handleFilterChange} allCerts={allCerts} />
      <UserTable certs={filtered} />
    </div>
  );
}

export default Dashboard;
