import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import QRScanner from '../../components/QRScanner';
import leadApi, { type Lead, type CreateLeadData, type UpdateLeadData } from '../../api/lead.api';
import rsvpApi, { type Rsvp } from '../../api/rsvp.api';

const EndUserLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<number | undefined>();
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [availableEvents, setAvailableEvents] = useState<Rsvp[]>([]);

  // Business card scanning states
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateLeadData>({
    scannedCardImage: '',
    ocrText: '',
    entryCode: '',
    eventId: undefined,
    details: {
      firstName: '',
      lastName: '',
      company: '',
      position: '',
      email: '',
      phoneNumber: '',
      website: '',
      address: '',
      city: '',
      country: '',
      notes: '',
    },
    rating: undefined,
    isIndependentLead: true,
  });
  // Store scan card/QR image (only one allowed)
  const [scanImage, setScanImage] = useState<File | null>(null);
  // Store up to 2 extra images
  const [extraImages, setExtraImages] = useState<File[]>([]);

  useEffect(() => {
    fetchLeads();
    fetchAvailableEvents();
  }, [pagination.page, searchQuery, filterRating]);

  const fetchAvailableEvents = async () => {
    try {
      const response = await rsvpApi.getMyRsvps();
      // Only include confirmed events (status === 1)
      const confirmedEvents = response.data.rsvps.filter((rsvp: Rsvp) => rsvp.status === 1);
      setAvailableEvents(confirmedEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setAvailableEvents([]);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { leads: fetchedLeads, pagination: paginationData } = await leadApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        rating: filterRating,
      });
      setLeads(fetchedLeads);
      setPagination((prev) => ({ ...prev, totalPages: paginationData.totalPages }));
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      // Always put scanImage first (if present), then extraImages
      if (scanImage) fd.append('images', scanImage);
      extraImages.forEach((file) => {
        fd.append('images', file);
      });
      fd.append('details', JSON.stringify(formData.details));
      if (formData.eventId) fd.append('eventId', formData.eventId);
      if (formData.rating !== undefined) fd.append('rating', String(formData.rating));
      if (formData.ocrText) fd.append('ocrText', formData.ocrText);
      if (formData.entryCode) fd.append('entryCode', formData.entryCode);
      if (formData.isIndependentLead !== undefined) fd.append('isIndependentLead', String(formData.isIndependentLead));
      await leadApi.create(fd);
      setShowCreateModal(false);
      resetForm();
      fetchLeads();
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      const updateData: UpdateLeadData = {
        details: formData.details,
        rating: formData.rating,
        ocrText: formData.ocrText,
        entryCode: formData.entryCode,
      };
      await leadApi.update(selectedLead._id, updateData);
      setShowEditModal(false);
      setSelectedLead(null);
      resetForm();
      fetchLeads();
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    try {
      await leadApi.delete(selectedLead._id);
      setShowDeleteConfirm(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  // Handle scan card/QR image upload (only one allowed)
  const handleScanImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setScanError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setScanError('Image size must be less than 10MB');
      return;
    }
    setScanImage(file);
    // For scan, still send base64 to backend for OCR
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      await handleScanCard(base64Image);
    };
    reader.readAsDataURL(file);
  };

  // Handle extra images upload (up to 2)
  const handleExtraImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const filtered = files.filter(
      (file) => validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024
    );
    setExtraImages((prev) => {
      const total = prev.length + filtered.length;
      if (total > 2) {
        return [...prev, ...filtered.slice(0, 2 - prev.length)];
      }
      return [...prev, ...filtered];
    });
  };

  const handleScanCard = async (image: string) => {
    try {
      setScanning(true);
      setScanError(null);
      setConfidence(null);

      const response = await leadApi.scanCard(image);

      if (response.success) {
        // Pre-populate form with extracted data
        setFormData({
          ...formData,
          scannedCardImage: response.data.scannedCardImage,
          ocrText: response.data.ocrText || '',
          details: {
            ...formData.details,
            ...response.data.details,
          },
        });
        setConfidence(response.data.confidence);
      }
    } catch (error: any) {
      setScanError(error.response?.data?.message || 'Failed to scan business card. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleQRScanSuccess = async (qrText: string) => {
    setShowQRScanner(false);
    setScanning(true);
    setScanError(null);
    try {
      const response = await leadApi.scanQRCode(qrText);

      if (response.data) {
        const updatedFormData = {
          ...formData,
          ocrText: response.data.rawData || qrText,
          details: {
            ...formData.details,
            ...response.data.details,
          },
        };

        // If QR scan returns only a code (no structured data), populate entryCode
        if (response.type === 'entry_code' || (!response.data.details || Object.keys(response.data.details).length === 0)) {
          updatedFormData.entryCode = response.data.entryCode || qrText;
        }

        setFormData(updatedFormData);
        setConfidence(response.data.confidence || 1.0);
      }
    } catch (error: any) {
      setScanError(error.message || 'Failed to process QR code');
    } finally {
      setScanning(false);
    }
  };

  const startCamera = async () => {
    try {
      setScanError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      setShowCamera(true);

      // Wait for video element to be available
      setTimeout(() => {
        const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = mediaStream;
        }
      }, 100);
    } catch (error: any) {
      setScanError('Unable to access camera. Please check permissions or use file upload instead.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
    if (!videoElement) return;

    const canvas = document.createElement('canvas');

    // Limit resolution to reduce file size (max 1920x1080)
    const maxWidth = 1920;
    const maxHeight = 1080;
    let width = videoElement.videoWidth;
    let height = videoElement.videoHeight;

    // Calculate scaled dimensions
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoElement, 0, 0, width, height);
      // Use 0.7 quality to reduce file size while maintaining readability
      const base64Image = canvas.toDataURL('image/jpeg', 0.7);

      // Stop camera and scan the captured image
      stopCamera();
      handleScanCard(base64Image);
    }
  };

  const resetForm = () => {
    setFormData({
      scannedCardImage: '',
      ocrText: '',
      entryCode: '',
      details: {
        firstName: '',
        lastName: '',
        company: '',
        position: '',
        email: '',
        phoneNumber: '',
        website: '',
        address: '',
        city: '',
        country: '',
        notes: '',
      },
      rating: undefined,
      isIndependentLead: true,
    });
    setScanImage(null);
    setExtraImages([]);
    setScanning(false);
    setScanError(null);
    setConfidence(null);
    stopCamera();
  };

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      scannedCardImage: lead.scannedCardImage,
      ocrText: lead.ocrText || '',
      entryCode: lead.entryCode || '',
      details: lead.details,
      rating: lead.rating,
      isIndependentLead: lead.isIndependentLead,
    });
    setShowEditModal(true);
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Leads</h1>
            <p className="text-gray-600 mt-1">Manage your collected business contacts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#9929EA] hover:bg-[#8820d0] text-white rounded-lg font-semibold transition-colors"
          >
            + Add Lead
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, company, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
            />
          </div>
          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {/* Leads Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9929EA]"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600 mb-4">Start adding leads to build your network</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-[#9929EA] hover:bg-[#8820d0] text-white rounded-lg font-semibold transition-colors"
            >
              Add Your First Lead
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entry Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.details?.firstName || ''} {lead.details?.lastName || ''}
                          </p>
                          <p className="text-sm text-gray-600">{lead.details?.position || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{lead.details?.company || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{lead.details?.email || '-'}</p>
                          <p className="text-gray-600">{lead.details?.phoneNumber || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRatingStars(lead.rating)}</td>
                      <td className="px-6 py-4">
                        {lead.entryCode ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                            {lead.entryCode}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.eventId ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {lead.eventId.eventName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                            Independent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {showCreateModal ? 'Add New Lead' : 'Edit Lead'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedLead(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={showCreateModal ? handleCreateLead : handleUpdateLead} className="p-6 space-y-4">
                {/* Business Card Scanning Section - Only show in create modal */}
                {showCreateModal && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-gray-900">Scan Business Card</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Upload a business card image to automatically extract contact information
                    </p>

                    {/* Scan Card/QR Image Upload (only one allowed) */}
                    <div className="flex items-center gap-3">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleScanImageUpload}
                          disabled={scanning || !!scanImage}
                          className="hidden"
                          id="card-upload"
                        />
                        <div className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-purple-300 rounded-lg ${!!scanImage ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500 cursor-pointer'} transition-colors`}>
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            {scanning ? 'Scanning...' : (!!scanImage ? 'Image Selected' : 'Upload Image')}
                          </span>
                        </div>
                      </label>

                      <button
                        type="button"
                        onClick={startCamera}
                        disabled={scanning || !!scanImage}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium">Take Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowQRScanner(true)}
                        disabled={scanning || !!scanImage}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span className="text-sm font-medium">Scan QR</span>
                      </button>
                    </div>

                    {/* Scan Card/QR Image Preview & Remove */}
                    {scanImage && (
                      <div className="mt-4 flex items-center gap-3">
                        <div className="relative group">
                          <img
                            src={URL.createObjectURL(scanImage)}
                            alt="Scan Card Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-purple-300 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setScanImage(null)}
                            className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-gray-700 hover:text-red-600 shadow group-hover:opacity-100 opacity-80"
                            title="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-xs text-gray-700">Scan Card/QR Image</span>
                      </div>
                    )}

                    {/* Scanning Progress */}
                    {scanning && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-purple-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
                        <span>Analyzing business card with AI...</span>
                      </div>
                    )}

                    {/* Success Message with Confidence Score */}
                    {confidence !== null && !scanning && (
                      <div className="mt-3 flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">Scan successful!</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-700">Confidence:</span>
                          <span className="text-sm font-bold text-green-800">{Math.round(confidence * 100)}%</span>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {scanError && (
                      <div className="mt-3 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-800">{scanError}</span>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-3">
                      Supported: JPEG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                )}

                {/* Extra Images Section (up to 2) */}
                {showCreateModal && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12m-9 4h10a1 1 0 001-1v-2a1 1 0 00-1-1H6a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-blue-900">Extra Images (Optional, up to 2)</h3>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleExtraImagesUpload}
                      disabled={extraImages.length >= 2}
                      className="mb-2"
                    />
                    {extraImages.length > 0 && (
                      <div className="mt-2 flex gap-3 flex-wrap">
                        {extraImages.map((file, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Extra Image ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-blue-300 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setExtraImages(extraImages.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-gray-700 hover:text-red-600 shadow group-hover:opacity-100 opacity-80"
                              title="Remove image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.details?.firstName || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, firstName: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.details?.lastName || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, lastName: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.details?.company || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, company: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={formData.details?.position || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, position: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.details?.email || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, email: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.details?.phoneNumber || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, phoneNumber: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.details?.website || ''}
                    onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, website: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.details?.city || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, city: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.details?.country || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, country: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    />
                  </div>
                </div>

                {showCreateModal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event (Optional)
                      <span className="text-xs text-gray-500 ml-2">Leave empty for independent lead</span>
                    </label>
                    <select
                      value={formData.eventId || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        eventId: e.target.value || undefined,
                        isIndependentLead: !e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                    >
                      <option value="">Independent Lead</option>
                      {availableEvents.map((rsvp) => (
                        <option key={rsvp._id} value={rsvp.eventId._id}>
                          {rsvp.eventId.eventName} - {rsvp.eventId.type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={formData.rating || ''}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                  >
                    <option value="">No Rating</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>

                {showEditModal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entry Code</label>
                    <input
                      type="text"
                      value={formData.entryCode}
                      onChange={(e) => setFormData({ ...formData, entryCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent font-mono"
                      placeholder="Entry code"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.details?.notes || ''}
                    onChange={(e) => setFormData({ ...formData, details: { ...formData.details!, notes: e.target.value } })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                  />
                </div>

                {showCreateModal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entry Code {formData.entryCode && <span className="text-green-600">(Auto-filled from QR scan)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.entryCode}
                        onChange={(e) => setFormData({ ...formData, entryCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent font-mono"
                        placeholder="Entry code from QR scan"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This field is automatically filled when you scan a QR code that contains only an entry code
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Image URL {formData.scannedCardImage && <span className="text-green-600">(Auto-filled from scan - editable)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.scannedCardImage}
                        onChange={(e) => setFormData({ ...formData, scannedCardImage: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9929EA] focus:border-transparent"
                        placeholder="Scan a card above or enter image URL"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This field is automatically filled when you scan a business card, but you can manually edit it
                      </p>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#9929EA] hover:bg-[#8820d0] text-white rounded-lg font-semibold transition-colors"
                  >
                    {showCreateModal ? 'Add Lead' : 'Update Lead'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedLead(null);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Lead</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the lead for{' '}
                <strong>
                  {selectedLead.details?.firstName || ''} {selectedLead.details?.lastName || ''}
                </strong>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteLead}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedLead(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onClose={() => setShowQRScanner(false)}
          />
        )}

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-white">Capture Business Card</h3>
                </div>
                <button
                  onClick={stopCamera}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Camera Preview */}
              <div className="relative bg-black">
                <video
                  id="camera-preview"
                  autoPlay
                  playsInline
                  className="w-full h-auto max-h-[60vh] object-contain"
                />

                {/* Overlay Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-white border-dashed rounded-lg w-[80%] h-[60%] opacity-50"></div>
                </div>

                {/* Instructions */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-sm">
                  Position the business card within the frame
                </div>
              </div>

              {/* Controls */}
              <div className="p-6 bg-gray-50 flex items-center justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EndUserLeads;
