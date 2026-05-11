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

type SortKey = 'title' | 'health' | 'date' | 'status';
type FilterType = 'all' | 'excellent' | 'good' | 'fair' | 'poor';

export default function ProductionQualityPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ProductionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overallQuality, setOverallQuality] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('health');
  const [filterBy, setFilterBy] = useState<FilterType>('all');

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
    if (health >= 80) return 'bg-emerald-100 text-emerald-900';
    if (health >= 60) return 'bg-blue-100 text-blue-900';
    if (health >= 40) return 'bg-amber-100 text-amber-900';
    return 'bg-rose-100 text-rose-900';
  };

  const getQualityGradient = (health: number) => {
    if (health >= 80) return 'from-emerald-500 to-emerald-600';
    if (health >= 60) return 'from-blue-500 to-blue-600';
    if (health >= 40) return 'from-amber-500 to-amber-600';
    return 'from-rose-500 to-rose-600';
  };

  const getQualityIndicator = (health: number) => {
    if (health >= 80) return 'Excellent';
    if (health >= 60) return 'Good';
    if (health >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Filter reports based on selected filter
  const filteredReports = reports.filter((report) => {
    if (filterBy === 'all') return true;
    if (filterBy === 'excellent') return report.health >= 80;
    if (filterBy === 'good') return report.health >= 60 && report.health < 80;
    if (filterBy === 'fair') return report.health >= 40 && report.health < 60;
    if (filterBy === 'poor') return report.health < 40;
    return true;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.eventTitle.localeCompare(b.eventTitle);
      case 'health':
        return b.health - a.health;
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <a
          href="/admin"
          className="text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all inline-flex items-center gap-2 w-fit"
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
          Real-time monitoring of production quality across all active events with detailed team analytics.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 hover:border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold tracking-wider text-gray-600 uppercase">Total Active</h3>
            <svg className="w-5 h-5 text-[#d4a017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
          <p className="text-[12px] text-gray-500 mt-2">Productions</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 hover:border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold tracking-wider text-gray-600 uppercase">Excellent</h3>
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{reports.filter(r => r.health >= 80).length}</p>
          <p className="text-[12px] text-gray-500 mt-2">80%+ Score</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 hover:border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold tracking-wider text-gray-600 uppercase">At Risk</h3>
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9 9 0 0119.5 19.5M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-rose-600">{reports.filter(r => r.health < 60).length}</p>
          <p className="text-[12px] text-gray-500 mt-2">&lt;60% Score</p>
        </div>

        <div className="bg-gradient-to-br from-[#d4a017]/15 to-[#d4a017]/5 border border-[#d4a017]/30 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 hover:border-[#d4a017]/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold tracking-wider text-gray-600 uppercase">Overall</h3>
            <svg className="w-5 h-5 text-[#d4a017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-[#d4a017]">{loading ? '...' : `${overallQuality}%`}</p>
          <p className="text-[12px] text-gray-500 mt-2">Average Quality</p>
        </div>
      </div>

      {/* Overall Quality Progress */}
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl p-8 md:p-10 hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quality Performance</h2>
            <p className="text-gray-600 text-[14px] mb-6">
              Your productions are performing at an <span className="font-semibold">{getQualityIndicator(overallQuality)}</span> level with consistent quality metrics across all events.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getQualityGradient(overallQuality)} transition-all duration-500`}
                    style={{ width: `${overallQuality}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-12">{overallQuality}%</span>
              </div>
              <p className="text-[12px] text-gray-500">
                Based on {reports.length} active production{reports.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeDasharray={`${(overallQuality / 100) * 282.7} 282.7`}
                  strokeDashoffset="0"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={`transition-all duration-500 ${
                    overallQuality >= 80
                      ? 'stroke-emerald-500'
                      : overallQuality >= 60
                      ? 'stroke-blue-500'
                      : overallQuality >= 40
                      ? 'stroke-amber-500'
                      : 'stroke-rose-500'
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{overallQuality}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterBy('all')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              filterBy === 'all'
                ? 'bg-[#d4a017] text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterBy('excellent')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              filterBy === 'excellent'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Excellent
          </button>
          <button
            onClick={() => setFilterBy('good')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              filterBy === 'good'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Good
          </button>
          <button
            onClick={() => setFilterBy('fair')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              filterBy === 'fair'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Fair
          </button>
          <button
            onClick={() => setFilterBy('poor')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              filterBy === 'poor'
                ? 'bg-rose-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            At Risk
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d4a017]/20 transition-all cursor-pointer"
        >
          <option value="health">Sort by Quality</option>
          <option value="title">Sort by Title</option>
          <option value="date">Sort by Date</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Productions List */}
      <div>
        <h2 className="text-2xl md:text-[28px] font-bold text-gray-900 tracking-tight mb-6">
          Production Details {filterBy !== 'all' && `(${sortedReports.length})`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-8 rounded-xl text-[14px] flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 p-12 rounded-xl text-[14px] text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12a5 5 0 1110 0A5 5 0 017 12z" />
            </svg>
            No productions found matching your filters
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedReports.map((report, index) => (
              <div
                key={report.eventId}
                className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 50}ms both`,
                }}
              >
                <style>{`
                  @keyframes slideIn {
                    from {
                      opacity: 0;
                      transform: translateY(10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#d4a017] transition-colors">
                          {report.eventTitle}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold text-gray-700 bg-gray-100 group-hover:bg-gray-200 transition-colors">
                          {report.eventType}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[13px] text-gray-600 flex-wrap">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {report.date}
                        </div>
                        <div className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#d4a017]/10 text-[#d4a017]">
                          {report.status}
                        </div>
                      </div>
                    </div>

                    {/* Team */}
                    {report.team && report.team.length > 0 && (
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <span className="text-[11px] text-gray-500 uppercase font-bold">Team:</span>
                        <div className="flex items-center -space-x-2">
                          {report.team.slice(0, 4).map((member, i) => (
                            member.avatarUrl ? (
                              <img
                                key={i}
                                src={member.avatarUrl}
                                alt={member.name}
                                className="w-8 h-8 rounded-full border-2 border-white object-cover hover:z-10 hover:scale-110 transition-transform duration-200 cursor-pointer shadow-sm"
                                title={member.name}
                              />
                            ) : (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-[#d4a017] to-amber-600 text-white text-[11px] font-bold flex items-center justify-center hover:z-10 hover:scale-110 transition-transform duration-200 cursor-pointer shadow-sm"
                                title={member.name}
                              >
                                {member.name?.charAt(0).toUpperCase()}
                              </div>
                            )
                          ))}
                          {report.team.length > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 text-[10px] font-bold flex items-center justify-center text-gray-600 hover:z-10 hover:scale-110 transition-transform duration-200 cursor-pointer shadow-sm">
                              +{report.team.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quality Score */}
                  <div className="flex flex-col items-start md:items-end gap-4 md:w-auto md:min-w-[200px]">
                    <div className={`px-6 py-4 rounded-lg font-bold text-3xl ${getQualityColor(report.health)} shadow-sm group-hover:shadow-md transition-shadow`}>
                      {report.health}%
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-gray-600 uppercase">Quality Score</span>
                        <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md ${getQualityColor(report.health)}`}>
                          {getQualityIndicator(report.health)}
                        </span>
                      </div>
                      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getQualityGradient(report.health)} transition-all duration-500`}
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
