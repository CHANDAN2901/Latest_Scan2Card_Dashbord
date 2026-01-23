import React, { useEffect, useState, useRef } from "react";
import catalogAPI from "../../api/catalog.api";
import type {
  Catalog,
  CatalogCategory,
  CategoryOption,
  AvailableLicenseKey,
} from "../../api/catalog.api";
import DashboardLayout from '../../components/DashboardLayout';

// Form data interface (separate from API input)
interface CatalogFormData {
  name: string;
  description: string;
  category: CatalogCategory;
  file: File | null;
  whatsappTemplate: string;
  emailTemplate: {
    subject: string;
    body: string;
  };
}

interface DrawerState {
  isOpen: boolean;
  catalog: Catalog | null;
  mode: "view" | "edit" | "create";
}

interface AssignDrawerState {
  isOpen: boolean;
  catalog: Catalog | null;
}

const TeamManagerCatalogs: React.FC = () => {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CatalogCategory | "">("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCatalogs, setTotalCatalogs] = useState(0);
  const catalogsPerPage = 10;

  // Drawer state
  const [drawer, setDrawer] = useState<DrawerState>({
    isOpen: false,
    catalog: null,
    mode: "view",
  });

  // Assignment drawer state
  const [assignDrawer, setAssignDrawer] = useState<AssignDrawerState>({
    isOpen: false,
    catalog: null,
  });
  const [availableLicenseKeys, setAvailableLicenseKeys] = useState<AvailableLicenseKey[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [expiryFilter, setExpiryFilter] = useState<"all" | "active" | "expired">("all");

  // Form state
  const [formData, setFormData] = useState<CatalogFormData>({
    name: "",
    description: "",
    category: "product",
    file: null,
    whatsappTemplate: "",
    emailTemplate: {
      subject: "",
      body: "",
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCatalogs();
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await catalogAPI.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchCatalogs = async (page = 1) => {
    setLoading(true);
    try {
      const result = await catalogAPI.getCatalogs(
        page,
        catalogsPerPage,
        search,
        categoryFilter || undefined
      );
      setCatalogs(result.catalogs);
      setTotalPages(result.pagination.pages);
      setTotalCatalogs(result.pagination.total);
    } catch (err) {
      console.error("Error fetching catalogs:", err);
      setCatalogs([]);
    }
    setLoading(false);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCatalogs(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchCatalogs(currentPage);
  }, [currentPage]);

  const openCreateDrawer = () => {
    setFormData({
      name: "",
      description: "",
      category: "product",
      file: null,
      whatsappTemplate: "Hi {{leadName}},\n\nPlease find our catalog here: {{docLink}}\n\nBest regards",
      emailTemplate: {
        subject: "{{catalogName}} - Catalog from {{eventName}}",
        body: "Dear {{leadName}},\n\nThank you for visiting our booth at {{eventName}}.\n\nPlease find our {{catalogName}} attached: {{docLink}}\n\nBest regards,\n{{stallName}}",
      },
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setDrawer({ isOpen: true, catalog: null, mode: "create" });
  };

  const openViewDrawer = (catalog: Catalog) => {
    setDrawer({ isOpen: true, catalog, mode: "view" });
    setFormData({
      name: catalog.name,
      description: catalog.description,
      category: catalog.category,
      file: null,
      whatsappTemplate: catalog.whatsappTemplate,
      emailTemplate: catalog.emailTemplate,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditDrawer = () => {
    setDrawer((prev) => ({ ...prev, mode: "edit" }));
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, catalog: null, mode: "view" });
  };

  const openAssignDrawer = async (catalog: Catalog) => {
    setAssignDrawer({ isOpen: true, catalog });
    setExpiryFilter("all");
    try {
      const keys = await catalogAPI.getAvailableLicenseKeys(catalog._id);
      setAvailableLicenseKeys(keys);
      // Pre-select already assigned keys
      const assigned = new Set(
        catalog.assignedLicenseKeys.map((ak) => `${ak.eventId}-${ak.licenseKey}`)
      );
      setSelectedKeys(assigned);
    } catch (err) {
      console.error("Error fetching license keys:", err);
    }
  };

  const closeAssignDrawer = () => {
    setAssignDrawer({ isOpen: false, catalog: null });
    setSelectedKeys(new Set());
    setExpiryFilter("all");
  };

  // Filter license keys based on expiry filter
  const filteredLicenseKeys = availableLicenseKeys.filter((lk) => {
    if (expiryFilter === "all") return true;
    if (expiryFilter === "active") return !lk.isExpired;
    if (expiryFilter === "expired") return lk.isExpired;
    return true;
  });

  const handleFormChange = (field: keyof CatalogFormData, value: string | File | null) => {
    setFormData((prev: CatalogFormData) => ({ ...prev, [field]: value }));
  };

  const handleEmailTemplateChange = (field: "subject" | "body", value: string) => {
    setFormData((prev: CatalogFormData) => ({
      ...prev,
      emailTemplate: { ...prev.emailTemplate, [field]: value },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev: CatalogFormData) => ({ ...prev, file }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Name is required");
      return;
    }
    if (drawer.mode === "create" && !formData.file) {
      alert("Document file is required");
      return;
    }
    if (!formData.whatsappTemplate.trim()) {
      alert("WhatsApp template is required");
      return;
    }
    if (!formData.emailTemplate.subject.trim() || !formData.emailTemplate.body.trim()) {
      alert("Email subject and body are required");
      return;
    }

    setSaving(true);
    try {
      if (drawer.mode === "create") {
        await catalogAPI.createCatalog({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          file: formData.file!,
          whatsappTemplate: formData.whatsappTemplate,
          emailTemplate: formData.emailTemplate,
        });
      } else if (drawer.mode === "edit" && drawer.catalog) {
        await catalogAPI.updateCatalog(drawer.catalog._id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          file: formData.file || undefined,
          whatsappTemplate: formData.whatsappTemplate,
          emailTemplate: formData.emailTemplate,
        });
      }
      closeDrawer();
      fetchCatalogs(currentPage);
    } catch (err: any) {
      console.error("Error saving catalog:", err);
      alert(err.response?.data?.message || "Failed to save catalog");
    }
    setSaving(false);
  };

  const handleDelete = async (catalogId?: string) => {
    const idToDelete = catalogId || drawer.catalog?._id;
    if (!idToDelete) return;
    if (!window.confirm("Are you sure you want to delete this catalog?")) return;

    setDeleting(true);
    try {
      await catalogAPI.deleteCatalog(idToDelete);
      if (drawer.isOpen) {
        closeDrawer();
      }
      fetchCatalogs(currentPage);
    } catch (err: any) {
      console.error("Error deleting catalog:", err);
      alert(err.response?.data?.message || "Failed to delete catalog");
    }
    setDeleting(false);
  };

  const handleToggleActive = async (catalog: Catalog) => {
    try {
      await catalogAPI.updateCatalog(catalog._id, { isActive: !catalog.isActive });
      fetchCatalogs(currentPage);
    } catch (err: any) {
      console.error("Error toggling active status:", err);
      alert(err.response?.data?.message || "Failed to update catalog");
    }
  };

  const handleKeyToggle = (eventId: string, licenseKey: string) => {
    const keyId = `${eventId}-${licenseKey}`;
    setSelectedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const handleSaveAssignments = async () => {
    if (!assignDrawer.catalog) return;

    setSaving(true);
    try {
      // Find keys to assign and unassign
      const currentAssigned = new Set(
        assignDrawer.catalog.assignedLicenseKeys.map((ak) => `${ak.eventId}-${ak.licenseKey}`)
      );

      const toAssign: { eventId: string; licenseKey: string }[] = [];
      const toUnassign: { eventId: string; licenseKey: string }[] = [];

      // Find new assignments
      selectedKeys.forEach((keyId) => {
        if (!currentAssigned.has(keyId)) {
          const [eventId, licenseKey] = keyId.split("-");
          toAssign.push({ eventId, licenseKey });
        }
      });

      // Find removals
      currentAssigned.forEach((keyId) => {
        if (!selectedKeys.has(keyId)) {
          const [eventId, licenseKey] = keyId.split("-");
          toUnassign.push({ eventId, licenseKey });
        }
      });

      if (toAssign.length > 0) {
        await catalogAPI.assignToLicenseKeys(assignDrawer.catalog._id, toAssign);
      }
      if (toUnassign.length > 0) {
        await catalogAPI.unassignFromLicenseKeys(assignDrawer.catalog._id, toUnassign);
      }

      closeAssignDrawer();
      fetchCatalogs(currentPage);
    } catch (err: any) {
      console.error("Error saving assignments:", err);
      alert(err.response?.data?.message || "Failed to save assignments");
    }
    setSaving(false);
  };

  const getCategoryColor = (category: CatalogCategory) => {
    const colors: Record<CatalogCategory, string> = {
      product: "bg-blue-100 text-blue-800",
      service: "bg-green-100 text-green-800",
      brochure: "bg-purple-100 text-purple-800",
      pricing: "bg-amber-100 text-amber-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.other;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <h2 className="text-2xl font-bold">Catalogs</h2>
          <button
            onClick={openCreateDrawer}
            className="px-4 py-2 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Catalog
          </button>
        </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CatalogCategory | "")}
          className="border p-2 rounded min-w-[200px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="border p-2 rounded min-w-[220px] flex-1"
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Catalogs Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#854AE6]"></div>
        </div>
      ) : catalogs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No catalogs found</h3>
          <p className="text-gray-600 mb-4">Create your first catalog to share with your leads.</p>
          <button
            onClick={openCreateDrawer}
            className="px-4 py-2 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Create Catalog
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned Keys</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {catalogs.map((catalog) => (
                  <tr key={catalog._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{catalog.name}</p>
                        <p className="text-sm text-gray-600 truncate max-w-[200px]">{catalog.description || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(catalog.category)}`}>
                        {catalog.category.charAt(0).toUpperCase() + catalog.category.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{catalog.assignedLicenseKeys.length}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(catalog)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          catalog.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {catalog.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(catalog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewDrawer(catalog)}
                          className="p-2 text-gray-600 hover:text-[#854AE6] hover:bg-gray-100 rounded-lg transition-colors"
                          title="View/Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openAssignDrawer(catalog)}
                          className="p-2 text-gray-600 hover:text-[#854AE6] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Assign to License Keys"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                        <a
                          href={catalog.docLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:text-[#854AE6] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Open Document"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleDelete(catalog._id)}
                          disabled={deleting}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Catalog"
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
          {!loading && catalogs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{((currentPage - 1) * catalogsPerPage) + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(currentPage * catalogsPerPage, totalCatalogs)}</span> of{' '}
                <span className="font-semibold">{totalCatalogs}</span> catalogs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit/View Drawer */}
      {drawer.isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] px-6 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {drawer.mode === "create" ? "Create Catalog" : drawer.mode === "edit" ? "Edit Catalog" : "Catalog Details"}
                </h2>
                {drawer.catalog && (
                  <p className="text-[#E8D5F8] text-sm mt-1">{drawer.catalog.name}</p>
                )}
              </div>
              <button
                onClick={closeDrawer}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Name *</label>
                    {drawer.mode === "view" ? (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg">{formData.name}</p>
                    ) : (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all"
                        placeholder="Enter catalog name"
                        maxLength={100}
                      />
                    )}
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
                    {drawer.mode === "view" ? (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg">{formData.description || "-"}</p>
                    ) : (
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleFormChange("description", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all resize-none"
                        placeholder="Enter description"
                        rows={2}
                        maxLength={500}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Category *</label>
                    {drawer.mode === "view" ? (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg">
                        {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
                      </p>
                    ) : (
                      <select
                        value={formData.category}
                        onChange={(e) => handleFormChange("category", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Document File {drawer.mode === "create" ? "*" : "(Upload new to replace)"}
                    </label>
                    {drawer.mode === "view" ? (
                      <div className="py-3 px-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-8 h-8 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium truncate">{drawer.catalog?.originalFileName}</p>
                            {drawer.catalog?.fileSize && (
                              <p className="text-xs text-gray-500">
                                {(drawer.catalog.fileSize / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                          <a
                            href={drawer.catalog?.docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm bg-[#854AE6] text-white rounded-lg hover:bg-[#6F33C5] transition-colors"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#854AE6] file:text-white hover:file:bg-[#6F33C5] file:cursor-pointer"
                        />
                        {formData.file && (
                          <p className="text-sm text-gray-600">
                            Selected: {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
                          </p>
                        )}
                        {drawer.mode === "edit" && drawer.catalog && !formData.file && (
                          <p className="text-sm text-gray-500">
                            Current file: {drawer.catalog.originalFileName}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Supported: PDF, DOC, DOCX, XLS, XLSX, Images (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* WhatsApp Template */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Template
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-700 mb-2">
                    Available placeholders: {`{{leadName}}, {{leadEmail}}, {{leadCompany}}, {{catalogName}}, {{docLink}}, {{eventName}}, {{stallName}}`}
                  </p>
                  {drawer.mode === "view" ? (
                    <p className="text-gray-900 font-medium py-3 px-4 bg-white rounded-lg whitespace-pre-wrap">{formData.whatsappTemplate}</p>
                  ) : (
                    <textarea
                      value={formData.whatsappTemplate}
                      onChange={(e) => handleFormChange("whatsappTemplate", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition-all resize-none"
                      placeholder="Hi {{leadName}}, here's our catalog..."
                      rows={4}
                      maxLength={1000}
                    />
                  )}
                </div>
              </div>

              {/* Email Template */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Template
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <p className="text-xs text-blue-700">
                    Available placeholders: {`{{leadName}}, {{leadEmail}}, {{leadCompany}}, {{catalogName}}, {{docLink}}, {{eventName}}, {{stallName}}`}
                  </p>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Subject *</label>
                    {drawer.mode === "view" ? (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-white rounded-lg">{formData.emailTemplate.subject}</p>
                    ) : (
                      <input
                        type="text"
                        value={formData.emailTemplate.subject}
                        onChange={(e) => handleEmailTemplateChange("subject", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="Email subject"
                        maxLength={200}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Body *</label>
                    {drawer.mode === "view" ? (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-white rounded-lg whitespace-pre-wrap">{formData.emailTemplate.body}</p>
                    ) : (
                      <textarea
                        value={formData.emailTemplate.body}
                        onChange={(e) => handleEmailTemplateChange("body", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all resize-none"
                        placeholder="Email body content..."
                        rows={6}
                        maxLength={5000}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 px-8 py-4 flex items-center justify-between shadow-md">
              <div>
                {drawer.mode === "view" && drawer.catalog && (
                  <button
                    onClick={() => handleDelete()}
                    disabled={deleting}
                    className="px-4 py-2 text-red-600 border-2 border-red-200 rounded-lg font-medium hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeDrawer}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  {drawer.mode === "view" ? "Close" : "Cancel"}
                </button>
                {drawer.mode === "view" ? (
                  <button
                    onClick={openEditDrawer}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {drawer.mode === "create" ? "Create" : "Save Changes"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assignment Drawer */}
      {assignDrawer.isOpen && assignDrawer.catalog && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 backdrop-blur-sm"
            onClick={closeAssignDrawer}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] px-6 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Assign to License Keys</h2>
                <p className="text-[#E8D5F8] text-sm mt-1">{assignDrawer.catalog.name}</p>
              </div>
              <button
                onClick={closeAssignDrawer}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">
                Select the license keys where this catalog should be available. Team members using these keys will be able to send this catalog to leads.
              </p>

              {/* Expiry Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter:</span>
                <select
                  value={expiryFilter}
                  onChange={(e) => setExpiryFilter(e.target.value as "all" | "active" | "expired")}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#854AE6]/20 focus:border-[#854AE6]"
                >
                  <option value="all">All Keys ({availableLicenseKeys.length})</option>
                  <option value="active">Active ({availableLicenseKeys.filter(k => !k.isExpired).length})</option>
                  <option value="expired">Expired ({availableLicenseKeys.filter(k => k.isExpired).length})</option>
                </select>
              </div>

              {filteredLicenseKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {availableLicenseKeys.length === 0 ? "No license keys available" : "No license keys match the filter"}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLicenseKeys.map((lk) => {
                    const keyId = `${lk.eventId}-${lk.licenseKey}`;
                    const isSelected = selectedKeys.has(keyId);
                    const isExpired = lk.isExpired;

                    return (
                      <div
                        key={keyId}
                        onClick={() => !isExpired && handleKeyToggle(lk.eventId, lk.licenseKey)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          isExpired
                            ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                            : isSelected
                              ? "border-[#854AE6] bg-[#854AE6]/5 cursor-pointer"
                              : "border-gray-200 hover:border-gray-300 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isExpired
                                ? "border-gray-200 bg-gray-100"
                                : isSelected
                                  ? "bg-[#854AE6] border-[#854AE6]"
                                  : "border-gray-300"
                            }`}
                          >
                            {isSelected && !isExpired && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${isExpired ? "text-gray-400" : "text-gray-900"}`}>{lk.licenseKey}</p>
                              {isExpired && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600">
                                  Expired
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${isExpired ? "text-gray-400" : "text-gray-600"}`}>{lk.eventName}</p>
                            {lk.stallName && (
                              <p className={`text-xs ${isExpired ? "text-gray-300" : "text-gray-500"}`}>Stall: {lk.stallName}</p>
                            )}
                            {lk.expiresAt && (
                              <p className={`text-xs mt-1 ${isExpired ? "text-gray-300" : "text-gray-400"}`}>
                                {isExpired ? "Expired" : "Expires"}: {new Date(lk.expiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 px-6 py-4 flex items-center justify-end gap-3 shadow-md">
              <button
                onClick={closeAssignDrawer}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignments}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Assignments
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </DashboardLayout>
  );
};

export default TeamManagerCatalogs;
