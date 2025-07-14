import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdvancedReports = ({ users, allCerts }) => {
  const currentYear = new Date().getFullYear();
  const [reportYear, setReportYear] = useState(currentYear);

  // Data for Certifications by Year chart
  const certsByYearData = useMemo(() => {
    const yearCounts = allCerts.reduce((acc, cert) => {
      if (cert.certDate && cert.certDate !== 'N/A') {
        const year = new Date(cert.certDate).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year);
  }, [allCerts]);

  // Data for Top 5 Certifications (remains as is)
  const topCertsData = useMemo(() => {
    const certCounts = allCerts.reduce((acc, cert) => {
      if (cert.certName && cert.certName !== 'N/A') {
        acc[cert.certName] = (acc[cert.certName] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(certCounts)
      .map(([certName, count]) => ({ certName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 certifications
  }, [allCerts]);

  // Data for Certifications by Month for selected year
  const certsByMonthData = useMemo(() => {
    const monthCounts = Array(12).fill(0).map((_, i) => ({ name: new Date(0, i).toLocaleString('default', { month: 'short' }), count: 0 }));

    allCerts.forEach(cert => {
      if (cert.certDate && cert.certDate !== 'N/A') {
        const dateObj = new Date(cert.certDate);
        if (dateObj.getFullYear() === Number(reportYear)) {
          const monthIndex = dateObj.getMonth();
          monthCounts[monthIndex].count++;
        }
      }
    });
    return monthCounts;
  }, [allCerts, reportYear]);

  // NEW: Data for Top 10 Persons by Certifications (Overall)
  const topPersonsOverallData = useMemo(() => {
    const personCertCounts = allCerts.reduce((acc, cert) => {
      const personKey = cert.email; // Using email as a unique identifier for a person
      acc[personKey] = acc[personKey] || { name: cert.name, email: cert.email, count: 0 };
      acc[personKey].count++;
      return acc;
    }, {});

    return Object.values(personCertCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 persons
  }, [allCerts]);

  // NEW: Data for Top 10 Persons by Certifications (for selected year)
  const topPersonsByYearData = useMemo(() => {
    const personsInSelectedYear = allCerts.filter(cert =>
      cert.certDate && new Date(cert.certDate).getFullYear() === Number(reportYear)
    );

    const personCertCounts = personsInSelectedYear.reduce((acc, cert) => {
      const personKey = cert.email;
      acc[personKey] = acc[personKey] || { name: cert.name, email: cert.email, count: 0 };
      acc[personKey].count++;
      return acc;
    }, {});

    return Object.values(personCertCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 persons for the selected year
  }, [allCerts, reportYear]);


  return (
    <div className="space-y-8">
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">📊 Advanced Report Filters</h3>
        <div className="flex items-center space-x-4">
          <label htmlFor="reportYear" className="text-gray-700 font-medium">Select Year:</label>
          <input
            id="reportYear"
            type="number"
            value={reportYear}
            onChange={(e) => setReportYear(Number(e.target.value))}
            min="1900"
            max={new Date().getFullYear() + 5}
            className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 w-32"
          />
        </div>
      </div>

      {/* Certifications by Year Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Certifications by Year</h3>
        {certsByYearData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={certsByYearData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="year" interval="preserveStartEnd" tickFormatter={(tick) => String(tick)} />
              <YAxis allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Certifications" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-10">No certification data available for this chart.</p>
        )}
      </div>

      {/* Certifications by Month for Selected Year Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Certifications by Month ({reportYear})</h3>
        {certsByMonthData.some(d => d.count > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={certsByMonthData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" name="Certifications" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-10">No certification data for the year {reportYear}.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Certifications List (remains) */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">🏆 Top 5 Certifications</h3>
          {topCertsData.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {topCertsData.map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="font-medium">{item.certName}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-10">No certification data available.</p>
          )}
        </div>

        {/* NEW: Top 10 Persons by Certifications (Overall) */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">🏅 Top 10 Persons by Certifications (Overall)</h3>
          {topPersonsOverallData.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {topPersonsOverallData.map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="font-medium">{item.name} ({item.email})</span>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-10">No overall certification data for persons available.</p>
          )}
        </div>

        {/* NEW: Top 10 Persons by Certifications (by Year) */}
        <div className="bg-white p-6 rounded-xl shadow-lg col-span-full"> {/* Make this span full width */}
          <h3 className="text-xl font-semibold text-gray-700 mb-4">🏅 Top 10 Persons by Certifications ({reportYear})</h3>
          {topPersonsByYearData.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {topPersonsByYearData.map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="font-medium">{item.name} ({item.email})</span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-10">No certification data for persons in {reportYear} available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;