import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  kyc_status: KYCStatus;
  reliability_score: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
}

const KYC_COLORS: Record<KYCStatus, string> = {
  unverified: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<'all' | 'worker' | 'business'>('all');
  const [kycFilter, setKycFilter] = useState<'all' | KYCStatus>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('role', filter);
    if (kycFilter !== 'all') q = q.eq('kyc_status', kycFilter);
    const { data } = await q;
    setUsers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter, kycFilter]);

  async function updateKYC(userId: string, status: KYCStatus) {
    await supabase.from('profiles').update({ kyc_status: status }).eq('id', userId);
    load();
  }

  async function toggleActive(userId: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', userId);
    load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Users</h2>
        <div className="flex gap-2">
          {(['all', 'worker', 'business'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === r ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {r}
            </button>
          ))}
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 bg-white"
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value as any)}
          >
            <option value="all">All KYC</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">KYC</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{u.full_name}</div>
                  <div className="text-xs text-gray-400">{u.phone ?? '—'}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="capitalize text-gray-600">{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${KYC_COLORS[u.kyc_status]}`}>
                    {u.kyc_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  ⭐ {u.average_rating?.toFixed(1) ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {format(new Date(u.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {u.kyc_status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateKYC(u.id, 'verified')}
                          className="text-xs text-green-600 hover:underline font-medium"
                        >Verify</button>
                        <button
                          onClick={() => updateKYC(u.id, 'rejected')}
                          className="text-xs text-red-500 hover:underline font-medium"
                        >Reject</button>
                      </>
                    )}
                    <button
                      onClick={() => toggleActive(u.id, u.is_active)}
                      className={`text-xs font-medium hover:underline ${u.is_active ? 'text-red-500' : 'text-green-600'}`}
                    >
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
