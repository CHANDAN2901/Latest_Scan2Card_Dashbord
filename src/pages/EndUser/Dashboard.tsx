import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import QRScanner from '../../components/QRScanner';
import leadApi, { type LeadStats } from '../../api/lead.api';
import { Button } from '@/components/ui/button';

const EndUserDashboard = () => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScanResult, setQRScanResult] = useState<any>(null);
  const [qrScanLoading, setQRScanLoading] = useState(false);
  const [qrScanError, setQRScanError] = useState<string | null>(null);

  const handleQRScanSuccess = async (qrText: string) => {
    setQRScanLoading(true);
    setQRScanError(null);
    try {
      const result = await leadApi.scanQRCode(qrText);
      setQRScanResult(result);
    } catch (e: any) {
      setQRScanError(e.message || 'Failed to process QR code');
    } finally {
      setQRScanLoading(false);
    }
  };
  
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await leadApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your lead overview.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#854AE6]"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Leads */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalLeads || 0}</p>
                  </div>
                  <div className="bg-[#854AE6]/10 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Active Leads */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Leads</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeLeads || 0}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Event Leads */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Event Leads</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.eventLeads || 0}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Independent Leads */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Independent</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.independentLeads || 0}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            {stats?.ratingDistribution && stats.ratingDistribution.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Rating Distribution</h2>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const ratingData = stats.ratingDistribution.find((r) => r._id === rating);
                    const count = ratingData?.count || 0;
                    const total = stats.ratingDistribution.reduce((sum, r) => sum + r.count, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;

                    return (
                      <div key={rating} className="flex items-center gap-4">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-sm font-medium text-gray-700">{rating}</span>
                          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-[#854AE6] h-full rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-16 text-right">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Button
                type="button"
                className="bg-gradient-to-r from-[#854AE6] to-[#6F3EC2] text-white p-8 rounded-xl shadow-lg transition-all transform hover:scale-105 flex flex-col items-center text-center gap-4 h-auto"
              >
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Scan Business Card</h3>
                <p className="text-[#E1D4FA]">Use OCR to capture lead information</p>
              </Button>

              <Button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="bg-gradient-to-r from-[#00C9A7] to-[#00B4D8] text-white p-8 rounded-xl shadow-lg transition-all transform hover:scale-105 flex flex-col items-center text-center gap-4 h-auto"
              >
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2m-10 0H5a2 2 0 01-2-2v-2" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Scan QR Code</h3>
                <p className="text-cyan-100">Scan a digital business card QR</p>
              </Button>

              <Button
                type="button"
                onClick={() => window.location.href = '/enduser/leads'}
                className="bg-white border-2 border-[#854AE6] text-[#854AE6] p-8 rounded-xl shadow-sm transition-all transform hover:scale-105 hover:shadow-lg flex flex-col items-center text-center gap-4 h-auto"
              >
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Manage Leads</h3>
                <p className="text-[#5E2AB2]">View and organize all your leads</p>
              </Button>
            </div>

            {/* QR Scanner Modal */}
            {showQRScanner && (
              <QRScanner
                onScanSuccess={handleQRScanSuccess}
                onClose={() => {
                  setShowQRScanner(false);
                  setQRScanResult(null);
                  setQRScanError(null);
                }}
              />
            )}

            {/* QR Scan Result Modal */}
            {(qrScanResult || qrScanLoading || qrScanError) && showQRScanner && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">QR Scan Result</h2>
                  {qrScanLoading && <div>Processing...</div>}
                  {qrScanError && <div className="text-red-500">{qrScanError}</div>}
                  {qrScanResult && (
                    <div className="space-y-2">
                      <div><b>Type:</b> {qrScanResult.type}</div>
                      <div><b>Confidence:</b> {qrScanResult.confidence}</div>
                      <div><b>Name:</b> {qrScanResult.data?.details.firstName} {qrScanResult.data?.details.lastName}</div>
                      <div><b>Email:</b> {qrScanResult.data?.details.email}</div>
                      <div><b>Phone:</b> {qrScanResult.data?.details.phoneNumber}</div>
                      <div><b>Company:</b> {qrScanResult.data?.details.company}</div>
                      <div><b>Notes:</b> {qrScanResult.data?.details.notes}</div>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#854AE6] hover:bg-[#6F33C5]"
                      onClick={() => {
                        setShowQRScanner(false);
                        setQRScanResult(null);
                        setQRScanError(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EndUserDashboard;
