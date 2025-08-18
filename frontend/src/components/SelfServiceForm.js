import React, { useState, useEffect } from 'react';

const SelfServiceForm = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [certifications, setCertifications] = useState([]);
  const [roles, setRoles] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/roles')
      .then(res => res.json())
      .then(setRoles)
      .catch(() => {});
  }, []);

  const fetchExisting = async () => {
    setMessage('');
    const res = await fetch(`http://localhost:4000/api/users/${encodeURIComponent(email)}`);
    if (res.ok) {
      const user = await res.json();
      setRole(user.role);
      setCertifications(user.certifications || []);
    } else {
      setMessage('User not found');
    }
  };

  const addCert = () => {
    const available = roles[role] || [];
    setCertifications([
      ...certifications,
      {
        provider: 'Salesforce',
        name: available[0] || '',
        earnedAt: '',
        expiresAt: '',
        status: 'active',
        meta: {},
      },
    ]);
  };

  const updateCert = (idx, field, value) => {
    const updated = certifications.map((c, i) => (i === idx ? { ...c, [field]: value } : c));
    setCertifications(updated);
  };

  const removeCert = idx => {
    setCertifications(certifications.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    setMessage('');
    const res = await fetch('http://localhost:4000/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, certifications }),
    });
    const json = await res.json();
    if (res.ok) {
      setMessage('Saved');
    } else {
      setMessage(json.error || 'Error');
    }
  };

  const roleOptions = Object.keys(roles);
  const availableCerts = roles[role] || [];

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Update Certifications</h2>
      <div className="mb-2">
        <label className="block text-sm">Email</label>
        <input className="border p-2 w-full" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Role</label>
        <select className="border p-2 w-full" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Select role</option>
          {roleOptions.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <button className="bg-gray-200 px-2 py-1 mr-2" onClick={fetchExisting}>
          Fetch Existing Data
        </button>
        <button className="bg-green-200 px-2 py-1" onClick={addCert} disabled={!role}>
          Add Certification
        </button>
      </div>
      {certifications.map((cert, idx) => (
        <div key={idx} className="mb-2 border p-2">
          <div className="flex mb-1">
            <select
              className="border p-1 mr-2 flex-grow"
              value={cert.name}
              onChange={e => updateCert(idx, 'name', e.target.value)}
            >
              {availableCerts.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border p-1 flex-grow"
              value={cert.earnedAt}
              onChange={e => updateCert(idx, 'earnedAt', e.target.value)}
            />
            <button className="ml-2 text-red-500" onClick={() => removeCert(idx)}>
              X
            </button>
          </div>
        </div>
      ))}
      <div className="mt-4">
        <button className="bg-blue-600 text-white px-4 py-2" onClick={submit}>
          Submit Updates
        </button>
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default SelfServiceForm;
