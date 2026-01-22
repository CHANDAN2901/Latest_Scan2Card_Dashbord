import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { invitationAPI, type TeamManager } from '../../api/invitation.api';
import { Button } from '@/components/ui/button';

const ExhibitorInvitations = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Team managers list
  const [teamManagers, setTeamManagers] = useState<TeamManager[]>([]);

  // Form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch team managers on mount
  useEffect(() => {
    fetchTeamManagers();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchTeamManagers = async () => {
    try {
      setLoading(true);
      const response = await invitationAPI.getTeamManagers();
      setTeamManagers(response.data?.teamManagers || []);
    } catch (err: any) {
      console.error('Failed to load team managers:', err);
      setTeamManagers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding manual email
  const handleAddManualEmail = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if already added
    if (selectedEmails.includes(email)) {
      setError('This email is already added');
      return;
    }

    setSelectedEmails([...selectedEmails, email]);
    setManualEmail('');
  };

  // Handle selecting team manager
  const handleSelectTeamManager = (email: string) => {
    if (!selectedEmails.includes(email)) {
      setSelectedEmails([...selectedEmails, email]);
    }
    setShowDropdown(false);
  };

  // Handle removing email
  const handleRemoveEmail = (email: string) => {
    setSelectedEmails(selectedEmails.filter((e) => e !== email));
  };

  // Handle send invitations
  const handleSendInvitations = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    if (selectedEmails.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    setSending(true);
    setError('');

    try {
      const result = await invitationAPI.sendInvitations({
        subject: subject.trim(),
        message: message.trim(),
        recipients: selectedEmails,
        channel,
      });

      if (result.data.sent > 0) {
        setSuccess(`Invitations sent successfully to ${result.data.sent} recipient(s)`);
        // Reset form
        setSubject('');
        setMessage('');
        setSelectedEmails([]);
      }

      if (result.data.failed > 0) {
        setError(`Failed to send to ${result.data.failed} recipient(s): ${result.data.failedRecipients.join(', ')}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  // Get team manager name by email
  const getTeamManagerName = (email: string): string | null => {
    const tm = teamManagers.find((t) => t.email === email);
    return tm ? `${tm.firstName} ${tm.lastName}` : null;
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-lg shadow-lg max-w-md w-full mx-4 animate-fade-in-down">
            <div className="flex items-center justify-between gap-3">
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-lg shadow-lg max-w-md w-full mx-4 animate-fade-in-down">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Send Invitations</h1>
          <p className="text-gray-600 mt-1">Invite team managers to your upcoming events</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSendInvitations}>
                {/* Subject */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Join us at Tech Expo 2026!"
                    maxLength={200}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{subject.length}/200 characters</p>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your invitation message here..."
                    rows={8}
                    maxLength={5000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{message.length}/5000 characters</p>
                </div>

                {/* Recipients Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipients <span className="text-red-500">*</span>
                  </label>

                  {/* Select from Team Managers */}
                  <div className="relative mb-3">
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-[#854AE6] transition-colors"
                    >
                      <span className="text-gray-600">
                        {loading ? 'Loading team managers...' : 'Select from past team managers'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {showDropdown && !loading && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {teamManagers.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">No team managers found</div>
                        ) : (
                          teamManagers.map((tm) => (
                            <button
                              key={tm._id}
                              type="button"
                              onClick={() => handleSelectTeamManager(tm.email)}
                              disabled={selectedEmails.includes(tm.email)}
                              className={`w-full px-4 py-3 text-left hover:bg-[#F4ECFF] flex items-center justify-between ${
                                selectedEmails.includes(tm.email) ? 'bg-gray-50 text-gray-400' : ''
                              }`}
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {tm.firstName} {tm.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{tm.email}</p>
                                {tm.companyName && <p className="text-xs text-gray-400">{tm.companyName}</p>}
                              </div>
                              {selectedEmails.includes(tm.email) && (
                                <svg className="w-5 h-5 text-[#854AE6]" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual Email Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualEmail();
                        }
                      }}
                      placeholder="Or enter email address manually"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                    />
                    <Button
                      type="button"
                      onClick={handleAddManualEmail}
                      variant="outline"
                      className="px-4 border-[#854AE6] text-[#854AE6] hover:bg-[#F4ECFF]"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Selected Recipients */}
                  {selectedEmails.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        {selectedEmails.length} recipient(s) selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmails.map((email) => {
                          const name = getTeamManagerName(email);
                          return (
                            <div
                              key={email}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F4ECFF] text-[#854AE6] rounded-full text-sm"
                            >
                              <span className="max-w-[200px] truncate">{name || email}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveEmail(email)}
                                className="hover:text-[#6F33C5] ml-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Channel Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Send via</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setChannel('email')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                        channel === 'email'
                          ? 'border-[#854AE6] bg-[#F4ECFF]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <svg
                        className={`w-6 h-6 ${channel === 'email' ? 'text-[#854AE6]' : 'text-gray-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className={`text-sm font-medium ${channel === 'email' ? 'text-[#854AE6]' : 'text-gray-600'}`}>
                        Email
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="p-4 border-2 border-gray-200 rounded-lg flex flex-col items-center gap-2 opacity-50 cursor-not-allowed"
                      title="Coming soon"
                    >
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-400">WhatsApp</span>
                      <span className="text-xs text-gray-400">(Coming Soon)</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={sending || selectedEmails.length === 0}
                  className="w-full py-3 bg-[#854AE6] hover:bg-[#6F33C5] text-white font-medium"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    `Send Invitation${selectedEmails.length > 1 ? 's' : ''}`
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#854AE6] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Write a compelling subject line to grab attention</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#854AE6] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Include event details like date, location, and what's new</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#854AE6] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Personalize your message to build better relationships</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#854AE6] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>You can send up to 50 invitations at once</span>
                </li>
              </ul>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Team Managers</h3>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#F4ECFF] rounded-lg">
                  <svg className="w-6 h-6 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '-' : teamManagers.length}</p>
                  <p className="text-sm text-gray-500">Past team managers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExhibitorInvitations;
