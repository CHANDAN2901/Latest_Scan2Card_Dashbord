import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import profileApi, { type UserProfile, type UpdateProfileData, type ChangePasswordData, type SubmitFeedbackData, type FeedbackData } from '../../api/profile.api';
import authApi from '../../api/auth.api';
import calendarApi, { type CalendarFeedStatus, type CalendarOAuthStatus } from '../../api/calendar.api';

const TeamManagerProfile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'feedback' | 'calendar'>('profile');

  // Calendar feed state (iCal subscription - fallback)
  const [calendarStatus, setCalendarStatus] = useState<CalendarFeedStatus | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<'feed' | 'webcal' | null>(null);

  // Calendar OAuth state (Google/Outlook integration)
  const [oauthStatus, setOauthStatus] = useState<CalendarOAuthStatus | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  // Profile image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState<SubmitFeedbackData>({
    message: '',
    rating: undefined,
    category: 'other',
  });

  // Handle OAuth callback from URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const oauthError = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (success === 'true' && provider) {
      setActiveTab('calendar');
      setSuccessMessage(`${provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} connected successfully! Meetings will now auto-sync with video links.`);
      // Clear URL params
      setSearchParams({});
      // Refresh OAuth status
      fetchOAuthStatus();
    } else if (oauthError) {
      setActiveTab('calendar');
      setError(decodeURIComponent(oauthError));
      // Clear URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchUserProfile();
    if (activeTab === 'feedback') {
      fetchFeedbackHistory();
    }
    if (activeTab === 'calendar') {
      fetchCalendarStatus();
      fetchOAuthStatus();
    }
  }, [activeTab]);

  const fetchCalendarStatus = async () => {
    try {
      setCalendarLoading(true);
      const status = await calendarApi.getStatus();
      setCalendarStatus(status);
    } catch (err: any) {
      console.error('Failed to load calendar status:', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleGenerateCalendarToken = async () => {
    try {
      setCalendarLoading(true);
      setError('');
      const result = await calendarApi.generateToken();
      setCalendarStatus({
        enabled: true,
        hasToken: true,
        feedUrl: result.feedUrl,
        webcalUrl: result.webcalUrl,
      });
      setSuccessMessage('Calendar feed URL generated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate calendar token');
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleRevokeCalendarToken = async () => {
    try {
      setCalendarLoading(true);
      setError('');
      await calendarApi.revokeToken();
      setCalendarStatus({
        enabled: false,
        hasToken: false,
        feedUrl: null,
        webcalUrl: null,
      });
      setSuccessMessage('Calendar feed has been disabled');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke calendar token');
    } finally {
      setCalendarLoading(false);
    }
  };

  const copyToClipboard = async (url: string, type: 'feed' | 'webcal') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  // OAuth Integration Functions
  const fetchOAuthStatus = async () => {
    try {
      setOauthLoading(true);
      const status = await calendarApi.getOAuthStatus();
      setOauthStatus(status);
    } catch (err: any) {
      console.error('Failed to load OAuth status:', err);
      // Don't show error if OAuth is not configured on server
    } finally {
      setOauthLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setOauthLoading(true);
      setError('');
      const result = await calendarApi.initiateGoogleOAuth();
      // Redirect to Google OAuth consent screen
      window.location.href = result.authUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate Google Calendar connection');
      setOauthLoading(false);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      setOauthLoading(true);
      setError('');
      const result = await calendarApi.initiateOutlookOAuth();
      // Redirect to Microsoft OAuth consent screen
      window.location.href = result.authUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate Outlook Calendar connection');
      setOauthLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      setOauthLoading(true);
      setError('');
      await calendarApi.disconnectCalendar();
      setOauthStatus({
        isConnected: false,
        provider: null,
        email: null,
        connectedAt: null,
        isTokenValid: null,
        availableProviders: oauthStatus?.availableProviders || { google: false, outlook: false },
      });
      setSuccessMessage('Calendar disconnected successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disconnect calendar');
    } finally {
      setOauthLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await authApi.getProfile();
      const userData = response.user;
      setUser(userData);
      setProfileForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || '',
      });
      // Set initial image preview if user has profile image
      if (userData.profileImage) {
        setImagePreview(userData.profileImage);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    }
  };

  const fetchFeedbackHistory = async () => {
    try {
      const { feedbacks: fetchedFeedbacks } = await profileApi.getFeedbackHistory(1, 50);
      setFeedbacks(fetchedFeedbacks);
    } catch (err: any) {
      console.error('Failed to load feedback:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Pass both form data and image file
      const updatedUser = await profileApi.updateProfile(profileForm, selectedImage);
      setUser(updatedUser);
      setSelectedImage(null); // Reset selected image
      setSuccessMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      await profileApi.changePassword(passwordForm);
      setSuccessMessage('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.message) {
      setError('Please provide feedback message');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      await profileApi.submitFeedback(feedbackForm);
      setSuccessMessage('Thank you for your feedback!');
      setFeedbackForm({ message: '', rating: undefined, category: 'other' });
      fetchFeedbackHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'reviewed': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('profile')}
              className={`rounded-none pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-[#854AE6] text-[#854AE6]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile Information
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('password')}
              className={`rounded-none pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-[#854AE6] text-[#854AE6]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Change Password
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('feedback')}
              className={`rounded-none pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'feedback'
                  ? 'border-[#854AE6] text-[#854AE6]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Feedback
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('calendar')}
              className={`rounded-none pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'calendar'
                  ? 'border-[#854AE6] text-[#854AE6]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar Sync
            </Button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && user && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Profile Image Upload Section */}
                <div className="flex items-start gap-6 pb-6 border-b">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="text-sm font-medium text-gray-700">Choose Image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      {selectedImage && (
                        <span className="text-sm text-green-600">
                          ✓ New image selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG, GIF or WebP. Max size 10MB.
                    </p>
                  </div>
                </div>

                {/* Profile Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed outline-none"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  {/* 2FA Toggle */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Two-Factor Authentication (2FA)
                        </label>
                        <p className="text-xs text-gray-500">Add extra security with OTP verification</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user?.twoFactorEnabled || false}
                          onChange={async (e) => {
                            try {
                              const updatedUser = await profileApi.toggle2FA(e.target.checked);
                              setUser(updatedUser);
                              setSuccessMessage(`2FA ${e.target.checked ? 'enabled' : 'disabled'} successfully`);
                              setTimeout(() => setSuccessMessage(''), 3000);
                            } catch (err: any) {
                              setError(err.response?.data?.message || '2FA toggle failed');
                              setTimeout(() => setError(''), 3000);
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D1B5FF] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#854AE6]"></div>
                      </label>
                    </div>
                    {user?.twoFactorEnabled && (
                      <p className="text-xs text-green-600 mt-2">✓ Use OTP: 000000 for testing</p>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                    minLength={6}
                    required
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit Feedback</CardTitle>
                <CardDescription>Help us improve by sharing your thoughts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={feedbackForm.category}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      >
                        <option value="other">General</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="improvement">Improvement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating (Optional)</label>
                      <div className="flex gap-2 items-center pt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                            className="focus-visible:ring-0 focus-visible:ring-offset-0"
                          >
                            <svg
                              className={`w-6 h-6 ${
                                feedbackForm.rating && star <= feedbackForm.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Your Feedback *</label>
                      <span className={`text-xs ${feedbackForm.message.length > 1000 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {feedbackForm.message.length}/1000
                      </span>
                    </div>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      rows={4}
                      placeholder="Share your thoughts, suggestions, or report issues..."
                      maxLength={1000}
                      required
                    />
                    {feedbackForm.message.length > 950 && (
                      <p className={`text-xs mt-1 ${feedbackForm.message.length > 1000 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {feedbackForm.message.length > 1000
                          ? 'Maximum character limit exceeded'
                          : `${1000 - feedbackForm.message.length} characters remaining`}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Feedback History */}
            <Card>
              <CardHeader>
                <CardTitle>Your Feedback History</CardTitle>
                <CardDescription>Track the status of your submitted feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbacks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No feedback submitted yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                      <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {feedback.category.replace('_', ' ')}
                            </span>
                            {feedback.rating && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span className="text-xs text-gray-600">{feedback.rating}/5</span>
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                            {feedback.status}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{feedback.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(feedback.createdAt).toLocaleDateString()} at {new Date(feedback.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* OAuth Calendar Integration - Primary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Calendar Integration
                </CardTitle>
                <CardDescription>
                  Connect your Google or Outlook calendar to automatically sync meetings with video conferencing links (Google Meet / Microsoft Teams)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {oauthLoading && !oauthStatus ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#854AE6]"></div>
                  </div>
                ) : oauthStatus?.isConnected ? (
                  // Connected State
                  <div className="space-y-6">
                    {/* Connection Status */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {oauthStatus.provider === 'google' ? (
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#F25022" d="M1 1h10v10H1z"/>
                                <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                                <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                                <path fill="#FFB900" d="M13 13h10v10H13z"/>
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-green-800">
                              {oauthStatus.provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} Connected
                            </p>
                            <p className="text-sm text-green-600">{oauthStatus.email}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Active
                        </span>
                      </div>
                      {oauthStatus.connectedAt && (
                        <p className="text-xs text-green-600 mt-2">
                          Connected on {new Date(oauthStatus.connectedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Benefits */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-800 mb-2">What happens now:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Meetings scheduled by your team members appear on your calendar
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {oauthStatus.provider === 'google' ? 'Google Meet' : 'Microsoft Teams'} links are auto-generated
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Your availability is automatically blocked
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Calendar invites are sent from your account
                        </li>
                      </ul>
                    </div>

                    {/* Disconnect Button */}
                    <div className="pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDisconnectCalendar}
                        disabled={oauthLoading}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {oauthLoading ? 'Disconnecting...' : 'Disconnect Calendar'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        This will revoke calendar access. New meetings won't be synced to your calendar.
                      </p>
                    </div>
                  </div>
                ) : (
                  // Not Connected State
                  <div className="space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Why connect your calendar?</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Meetings appear directly on your calendar (you own the events)</li>
                        <li>• Auto-generated Google Meet or Microsoft Teams video links</li>
                        <li>• Your availability is automatically blocked</li>
                        <li>• Calendar invites sent from your account</li>
                      </ul>
                    </div>

                    {/* Connect Buttons */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Google Calendar */}
                      <button
                        onClick={handleConnectGoogle}
                        disabled={oauthLoading || !oauthStatus?.availableProviders?.google}
                        className="flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#854AE6] hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-8 h-8" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Google Calendar</p>
                          <p className="text-xs text-gray-500">With Google Meet links</p>
                        </div>
                      </button>

                      {/* Outlook Calendar */}
                      <button
                        onClick={handleConnectOutlook}
                        disabled={oauthLoading || !oauthStatus?.availableProviders?.outlook}
                        className="flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#854AE6] hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-8 h-8" viewBox="0 0 24 24">
                          <path fill="#F25022" d="M1 1h10v10H1z"/>
                          <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                          <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                          <path fill="#FFB900" d="M13 13h10v10H13z"/>
                        </svg>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Outlook Calendar</p>
                          <p className="text-xs text-gray-500">With Microsoft Teams links</p>
                        </div>
                      </button>
                    </div>

                    {/* Provider Not Configured Notice */}
                    {oauthStatus && !oauthStatus.availableProviders?.google && !oauthStatus.availableProviders?.outlook && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          Calendar integration is not configured on the server. Please contact your administrator.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* iCal Feed - Fallback Option */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Calendar Feed (Alternative)
                </CardTitle>
                <CardDescription>
                  Subscribe to a read-only calendar feed. Note: This doesn't support video link generation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calendarLoading && !calendarStatus ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#854AE6]"></div>
                  </div>
                ) : calendarStatus?.enabled && calendarStatus?.feedUrl ? (
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Feed Enabled
                      </span>
                    </div>

                    {/* Feed URLs */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Feed URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={calendarStatus.feedUrl}
                            readOnly
                            className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-600"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(calendarStatus.feedUrl!, 'feed')}
                            className="shrink-0 text-xs"
                          >
                            {copiedUrl === 'feed' ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                      </div>

                      {calendarStatus.webcalUrl && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Webcal URL (Apple)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={calendarStatus.webcalUrl}
                              readOnly
                              className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-600"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(calendarStatus.webcalUrl!, 'webcal')}
                              className="shrink-0 text-xs"
                            >
                              {copiedUrl === 'webcal' ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Disable Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRevokeCalendarToken}
                      disabled={calendarLoading}
                      className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                    >
                      {calendarLoading ? 'Disabling...' : 'Disable Feed'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm text-gray-500">
                      Generate a feed URL for read-only calendar subscription
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateCalendarToken}
                      disabled={calendarLoading}
                    >
                      {calendarLoading ? 'Generating...' : 'Enable Feed'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamManagerProfile;
