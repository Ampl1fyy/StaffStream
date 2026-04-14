import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export default function Disputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | DisputeStatus>('open');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [resolution, setResolution] = useState('');

  async function load() {
    let q = supabase
      .from('disputes')
      .select('*, profiles!raised_by(full_name), applications(shift_id, shifts(title))')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setDisputes(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function resolve(id: string, status: 'resolved' | 'dismissed') {
    await supabase.from('disputes').update({
      status,
      resolution_note: resolution,
      resolved_at: new Date().toISOString(),
    }).eq('id', id);
    setSelected(null);
    setResolution('');
    load();
  }

  const statusColors: Record<DisputeStatus, string> = {
    open: 'bg-red-100 text-red-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Disputes</h2>
        <div className="flex gap-2">
          {(['all', 'open', 'under_review', 'resolved', 'dismissed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Raised By</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Shift</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : disputes.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No disputes found.</td></tr>
            ) : disputes.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800 font-medium">{d.profiles?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{d.applications?.shifts?.title ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{d.reason}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(d.created_at), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[d.status as DisputeStatus] ?? 'bg-gray-100'}`}>
                    {d.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {(d.status === 'open' || d.status === 'under_review') && (
                    <button
                      onClick={() => setSelected(d)}
                      className="text-xs text-primary-600 hover:underline font-medium"
                    >Review</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Review Dispute</h3>
            <p className="text-sm text-gray-500 mb-4">Raised by: {selected.profiles?.full_name}</p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">{selected.reason}</p>
              {selected.description && <p className="text-sm text-gray-600">{selected.description}</p>}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Note</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Explain the resolution..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => resolve(selected.id, 'resolved')}
                className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700"
              >Mark Resolved</button>
              <button
                onClick={() => resolve(selected.id, 'dismissed')}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >Dismiss</button>
              <button
                onClick={() => setSelected(null)}
                className="px-4 text-gray-400 hover:text-gray-600 text-sm"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
