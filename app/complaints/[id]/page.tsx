import { getComplaintById } from '@/lib/complaints';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default async function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const complaint = await getComplaintById(params.id);

  if (!complaint) {
    notFound();
  }

  const deadlineDate = new Date(complaint.sla_deadline);
  const isOverdue = deadlineDate < new Date() && complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Depot Dashboard</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-brand-300 font-bold">{complaint.reference_number}</span>
            <h1 className="text-xl font-bold mt-0.5">{complaint.category}</h1>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              complaint.status === 'RESOLVED'
                ? 'bg-emerald-500 text-white'
                : complaint.status === 'IN_PROGRESS'
                ? 'bg-blue-500 text-white'
                : complaint.escalated || isOverdue
                ? 'bg-rose-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {complaint.escalated || isOverdue ? 'ESCALATED (OVERDUE)' : complaint.status}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-medium">
              {complaint.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Assigned Depot</span>
              <strong className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                {complaint.depot_name || 'Central Command'}
              </strong>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Bus Route</span>
              <strong className="text-sm font-bold text-slate-900">
                {complaint.route_name || complaint.route_id || 'General Route'}
              </strong>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Incident Location</span>
              <strong className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                {complaint.location || 'Unspecified'}
              </strong>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">SLA Target Deadline</span>
              <strong className={`text-sm font-bold flex items-center gap-1.5 ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                <Clock className="w-4 h-4" />
                {deadlineDate.toLocaleString()}
              </strong>
            </div>
          </div>

          {complaint.evidence_url && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Evidence Reference</h3>
              <p className="text-xs font-mono bg-slate-100 p-3 rounded-lg text-slate-700 truncate">
                {complaint.evidence_url}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
