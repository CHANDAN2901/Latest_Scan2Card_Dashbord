import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import rsvpApi, { type Rsvp } from '../../api/rsvp.api';
import { Button } from '@/components/ui/button';

const EndUserEvents = () => {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [joiningEvent, setJoiningEvent] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await rsvpApi.getMyRsvps();
      setRsvps(response.data.rsvps);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setRsvps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateLicenseKey = async () => {
    if (!licenseKey.trim()) {
      setErrorMessage('Please enter a license key');
      return;
    }

    try {
      setValidating(true);
      setErrorMessage('');
      const result = await rsvpApi.validateLicenseKey(licenseKey.trim());
      
      if (result.data.valid) {
        setValidationResult(result.data);
      } else {
        setErrorMessage('Invalid or expired license key');
        setValidationResult(null);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to validate license key');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!licenseKey.trim()) return;

    try {
      setJoiningEvent(true);
      setErrorMessage('');
      await rsvpApi.create({ rsvpLicenseKey: licenseKey.trim() });
      
      // Close modal and refresh events
      setShowJoinModal(false);
      setLicenseKey('');
      setValidationResult(null);
      fetchMyEvents();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to join event');
    } finally {
      setJoiningEvent(false);
    }
  };

  const resetJoinModal = () => {
    setShowJoinModal(false);
    setLicenseKey('');
    setValidationResult(null);
    setErrorMessage('');
  };

  const handleCancelRsvp = async (rsvpId: string) => {
    if (!confirm('Are you sure you want to cancel this event registration?')) return;
    try {
      await rsvpApi.cancel(rsvpId);
      fetchMyEvents();
    } catch (error) {
      console.error('Failed to cancel RSVP:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
            <p className="text-gray-600 mt-2">Events you've registered for</p>
          </div>
          <Button onClick={() => setShowJoinModal(true)} className="gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Join Event
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#854AE6]"></div>
          </div>
        ) : rsvps.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events registered</h3>
            <p className="text-gray-600">Use a license key to register for an event</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">License Key</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rsvps.map((rsvp, index) => (
                    <tr key={rsvp._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{rsvp.eventId.eventName}</p>
                          {rsvp.eventId.description && rsvp.eventId.description !== 'NA' && (
                            <p className="text-sm text-gray-600 line-clamp-1">{rsvp.eventId.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {rsvp.eventId.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">
                            {new Date(rsvp.eventId.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-gray-600 text-xs">
                            to {new Date(rsvp.eventId.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {rsvp.eventId.location && (rsvp.eventId.location.venue || rsvp.eventId.location.city) ? (
                          <div className="text-sm">
                            {rsvp.eventId.location.venue && (
                              <p className="text-gray-900 font-medium">{rsvp.eventId.location.venue}</p>
                            )}
                            {rsvp.eventId.location.city && (
                              <p className="text-gray-600 text-xs">{rsvp.eventId.location.city}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-[#F4ECFF] text-[#5E2AB2] px-2 py-1 rounded text-xs font-mono border border-[#E3D4FF]">
                          {rsvp.eventLicenseKey}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          rsvp.status === 1
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${rsvp.status === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {rsvp.status === 1 ? 'Confirmed' : 'Cancelled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(rsvp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {rsvp.status === 1 && (
                          <Button
                            onClick={() => handleCancelRsvp(rsvp._id)}
                            variant="outline"
                            size="sm"
                            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Join Event Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Join Event</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={resetJoinModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter License Key
                  </label>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => {
                      setLicenseKey(e.target.value);
                      setErrorMessage('');
                      setValidationResult(null);
                    }}
                    placeholder="Enter your 9-character license key"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent text-center font-mono text-lg uppercase"
                    maxLength={9}
                  />
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                )}

                {validationResult && validationResult.valid && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="font-semibold text-green-900">Valid License Key</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-green-700 font-medium">{validationResult.event.name}</p>
                        <p className="text-green-600 text-xs">{validationResult.event.type}</p>
                      </div>
                      <div className="flex items-center gap-2 text-green-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">
                          {new Date(validationResult.event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' - '}
                          {new Date(validationResult.event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {validationResult.licenseKey.stallName && (
                        <p className="text-green-600 text-xs">
                          Stall: {validationResult.licenseKey.stallName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {!validationResult ? (
                    <>
                      <Button
                        onClick={handleValidateLicenseKey}
                        disabled={validating || !licenseKey.trim()}
                        className="flex-1"
                      >
                        {validating ? 'Validating...' : 'Validate Key'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetJoinModal}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleJoinEvent}
                        disabled={joiningEvent}
                        variant="success"
                        className="flex-1"
                      >
                        {joiningEvent ? 'Joining...' : 'Confirm & Join'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetJoinModal}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EndUserEvents;
