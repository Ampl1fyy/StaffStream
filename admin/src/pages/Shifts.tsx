import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function Shifts() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase
      .from('shifts')
      .select('*, businesses(name), applications(count)')
      .order('time_start', { ascending: false })
      .limit(100);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    q.then(({ data }) => { setShifts(data ?? []); setLoading(false); });
  }, [statusFilter]);

  async function cancelShift(id: string) {
    if (!confirm('Cancel this shift?')) return;
    await supabase.from('shifts').update({ status: 'cancelled' }).eq('id', id);
    setShifts((s) => s.map((sh) => sh.id === id ? { ...sh, status: 'cancelled' } : sh));
  }

  const statuses = ['all', 'open', 'filled', 'active', 'completed', 'cancelled'];
  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    filled: 'bg-purple-100 text-purple-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Shifts</h2>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Shift</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Pay/hr</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slots</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : shifts.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No shifts found.</td></tr>
            ) : shifts.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{s.title}</div>
                  <div className="text-xs text-gray-400">{s.role_required}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.businesses?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {format(new Date(s.time_start), 'MMM d, h:mm a')}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">₱{s.hourly_rate}</td>
                <td className="px-4 py-3 text-gray-600">{s.slots_filled}/{s.slots}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {s.status === 'open' && (
                    <button
                      onClick={() => cancelShift(s.id)}
                      className="text-xs text-red-500 hover:underline font-medium"
                    >Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
