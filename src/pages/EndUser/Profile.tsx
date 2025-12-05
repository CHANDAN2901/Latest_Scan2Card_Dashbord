import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import profileApi, { type UserProfile, type UpdateProfileData, type ChangePasswordData, type SubmitFeedbackData, type FeedbackData } from '../../api/profile.api';
import authApi from '../../api/auth.api';

const EndUserProfile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'feedback'>('profile');

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

  useEffect(() => {
    fetchUserProfile();
    if (activeTab === 'feedback') {
      fetchFeedbackHistory();
    }
  }, [activeTab]);

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Feedback *</label>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      rows={4}
                      placeholder="Share your thoughts, suggestions, or report issues..."
                      required
                    />
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
      </div>
    </DashboardLayout>
  );
};

export default EndUserProfile;
