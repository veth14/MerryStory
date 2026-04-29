"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

interface ProductionReport {
  eventId: string;
  eventTitle: string;
  eventType: string;
  health: number;
  date: string;
  status: string;
  team: Array<{
    name: string;
    avatarUrl?: string;
  }>;
}

export default function ProductionQualityPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ProductionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overallQuality, setOverallQuality] = useState(0);

  useEffect(() => {
    const fetchQualityData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const idToken = await user.getIdToken();

        const eventsRes = await fetch('/api/events', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!eventsRes.ok) throw new Error('Failed to fetch events');
        const events: any[] = await eventsRes.json();

        // Filter active events and calculate quality metrics
        const activeEvents = events
          .filter(event => event.status && event.status.toLowerCase().includes('active'))
          .map(event => ({
            eventId: event._id,
            eventTitle: event.title,
            eventType: event.type || 'General',
            health: event.health || 0,
            date: event.date ? new Date(event.date).toLocaleDateString() : 'No Date',
            status: event.status,
            team: event.team || [],
          }))
          .sort((a, b) => b.health - a.health);

        setReports(activeEvents);

        // Calculate overall quality
        if (activeEvents.length > 0) {
          const healthScores = activeEvents
            .map((e: any) => e.health)
            .filter((score: number) => score > 0);
          
          if (healthScores.length > 0) {
            const average = healthScores.reduce((a: number, b: number) => a + b, 0) / healthScores.length;
            setOverallQuality(Math.round(average));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load production quality data');
      } finally {
        setLoading(false);
      }
    };

    fetchQualityData();
  }, [user]);

  const getQualityColor = (health: number) => {
    if (health >= 80) return 'bg-green-100 text-green-900';
    if (health >= 60) return 'bg-blue-100 text-blue-900';
    if (health >= 40) return 'bg-yellow-100 text-yellow-900';
    return 'bg-red-100 text-red-900';
  };

  const getQualityIndicator = (health: number) => {
    if (health >= 80) return 'Excellent';
    if (health >= 60) return 'Good';
    if (health >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-12 w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <a
          href="/admin"
          className="text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-6 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors inline-flex items-center gap-2 w-fit mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </a>
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#d4a017] uppercase">Admin Portal</p>
        <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-gray-900 leading-[1.05] tracking-tight">
          Production Quality Report
        </h1>
        <p className="text-gray-500 text-[15px] leading-relaxed max-w-2xl">
          Comprehensive view of all active production sets and their quality metrics across the organization.
        </p>
      </div>

      {/* Overall Quality Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#d4a017]/10 to-yellow-50 border border-[#d4a017]/20 rounded-xl p-8 md:p-10 flex flex-col justify-between">
          <div>
            <h2 className="text-[11px] font-bold tracking-wider text-gray-600 uppercase mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#d4a017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Overall Production Quality
            </h2>
            <p className="text-6xl md:text-[72px] font-extrabold text-gray-900 leading-none tracking-tight">
              {loading ? '...' : `${overallQuality}%`}
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <p className="text-[13px] text-gray-600 font-medium">
              Average quality score across {reports.length} active production{reports.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#d4a017] to-yellow-500 transition-all duration-500"
                  style={{ width: `${overallQuality}%` }}
                />
              </div>
              <span className="text-[12px] font-bold text-gray-600">{getQualityIndicator(overallQuality)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-8 md:p-10 flex flex-col justify-center">
          <h3 className="text-[11px] font-bold tracking-wider text-gray-600 uppercase mb-6">Quality Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">Active Productions</span>
              <span className="text-2xl font-bold text-gray-900">{reports.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">Excellent (80-100%)</span>
              <span className="text-lg font-bold text-green-600">
                {reports.filter(r => r.health >= 80).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">Good (60-79%)</span>
              <span className="text-lg font-bold text-blue-600">
                {reports.filter(r => r.health >= 60 && r.health < 80).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">Fair (40-59%)</span>
              <span className="text-lg font-bold text-yellow-600">
                {reports.filter(r => r.health >= 40 && r.health < 60).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">Needs Improvement (&lt;40%)</span>
              <span className="text-lg font-bold text-red-600">
                {reports.filter(r => r.health < 40).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Productions List */}
      <div>
        <h2 className="text-2xl md:text-[28px] font-bold text-gray-900 tracking-tight mb-6">
          Production Details
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-xl text-[13px]">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 p-6 rounded-xl text-[13px] text-center">
            No active productions found
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.eventId}
                className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{report.eventTitle}</h3>
                        <div className="flex items-center gap-3 text-[13px] text-gray-600">
                          <span className="px-2.5 py-1 rounded-md bg-gray-100 font-medium">
                            {report.eventType}
                          </span>
                          <span>{report.date}</span>
                          <span className="px-2.5 py-1 rounded-md bg-[#d4a017]/10 text-[#d4a017] font-medium text-[11px]">
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Team */}
                    {report.team && report.team.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[11px] text-gray-500 uppercase font-bold">Team:</span>
                        <div className="flex -space-x-2">
                          {report.team.slice(0, 3).map((member, i) => (
                            member.avatarUrl ? (
                              <img
                                key={i}
                                src={member.avatarUrl}
                                alt={member.name}
                                className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                title={member.name}
                              />
                            ) : (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 text-[9px] font-bold flex items-center justify-center text-gray-600"
                                title={member.name}
                              >
                                {member.name?.charAt(0).toUpperCase()}
                              </div>
                            )
                          ))}
                          {report.team.length > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-[#d4a017] text-[9px] font-bold flex items-center justify-center text-white">
                              +{report.team.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quality Score */}
                  <div className="flex flex-col items-end gap-4 md:w-auto">
                    <div className={`px-4 py-3 rounded-lg font-bold text-2xl ${getQualityColor(report.health)}`}>
                      {report.health}%
                    </div>
                    <div className="w-full md:w-40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-600 uppercase">Quality Score</span>
                        <span className="text-[11px] font-semibold text-gray-900">
                          {getQualityIndicator(report.health)}
                        </span>
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            report.health >= 80
                              ? 'bg-green-500'
                              : report.health >= 60
                              ? 'bg-blue-500'
                              : report.health >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${report.health}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
