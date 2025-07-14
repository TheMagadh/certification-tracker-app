import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatsOverview = ({ certs }) => {
  const total = certs.length;
  // Aggregate certifications by name for the chart
  const certCounts = useMemo(() => {
    return certs.reduce((acc, curr) => {
      acc[curr.certName] = (acc[curr.certName] || 0) + 1;
      return acc;
    }, {});
  }, [certs]);

  // Convert to array of objects for Recharts
  const chartData = useMemo(() => {
    return Object.entries(certCounts).map(([name, count]) => ({
      name,
      count
    }));
  }, [certCounts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Total Certifications Card */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">Total Certifications</h3>
          <p className="text-5xl font-extrabold">{total}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="10" y1="9" x2="10" y2="9"></line>
        </svg>
      </div>

      {/* Certifications by Type Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Certifications by Type</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} style={{ fontSize: '12px' }} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Count" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-10">No certification data available for charting.</p>
        )}
      </div>
    </div>
  );
};

export default StatsOverview;