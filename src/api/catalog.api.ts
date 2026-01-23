import axiosInstance from './axios.config';

// Catalog category enum
export type CatalogCategory = 'product' | 'service' | 'brochure' | 'pricing' | 'other';

// Email template interface
export interface EmailTemplate {
  subject: string;
  body: string;
}

// Assigned license key interface
export interface AssignedLicenseKey {
  eventId: string;
  licenseKey: string;
}

// Catalog interface
export interface Catalog {
  _id: string;
  teamManagerId: string;
  name: string;
  description: string;
  category: CatalogCategory;
  docLink: string;
  s3Key: string;
  originalFileName: string;
  fileSize?: number;
  contentType?: string;
  whatsappTemplate: string;
  emailTemplate: EmailTemplate;
  assignedLicenseKeys: AssignedLicenseKey[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create catalog input
export interface CreateCatalogInput {
  name: string;
  description?: string;
  category: CatalogCategory;
  file: File;
  whatsappTemplate: string;
  emailTemplate: EmailTemplate;
}

// Update catalog input
export interface UpdateCatalogInput {
  name?: string;
  description?: string;
  category?: CatalogCategory;
  file?: File;
  whatsappTemplate?: string;
  emailTemplate?: EmailTemplate;
  isActive?: boolean;
}

// Pagination interface
export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Catalogs response interface
export interface CatalogsResponse {
  catalogs: Catalog[];
  pagination: Pagination;
}

// Category option interface
export interface CategoryOption {
  value: CatalogCategory;
  label: string;
}

// Catalog stats interface
export interface CatalogStats {
  totalCatalogs: number;
  activeCatalogs: number;
  inactiveCatalogs: number;
  categoryBreakdown: Record<string, number>;
  totalAssignments: number;
}

// Available license key for assignment
export interface AvailableLicenseKey {
  eventId: string;
  eventName: string;
  licenseKey: string;
  stallName: string;
  isAssigned: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  createdAt: string | null;
}

// Template preview data
export interface TemplatePreviewData {
  leadName?: string;
  leadEmail?: string;
  leadCompany?: string;
  catalogName?: string;
  docLink?: string;
  eventName?: string;
  stallName?: string;
}

// Template preview response
export interface TemplatePreviewResponse {
  original: string;
  processed: string;
}

const catalogAPI = {
  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  // Create a new catalog
  createCatalog: async (data: CreateCatalogInput): Promise<Catalog> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('name', data.name);
    formData.append('category', data.category);
    formData.append('whatsappTemplate', data.whatsappTemplate);
    formData.append('emailTemplate', JSON.stringify(data.emailTemplate));
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await axiosInstance.post<{ success: boolean; data: Catalog; message: string }>(
      '/catalogs',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Get all catalogs with pagination and filters
  getCatalogs: async (
    page = 1,
    limit = 10,
    search = '',
    category?: CatalogCategory
  ): Promise<{ catalogs: Catalog[]; pagination: Pagination }> => {
    const response = await axiosInstance.get<{ success: boolean; data: Catalog[]; pagination: Pagination }>('/catalogs', {
      params: { page, limit, search, category },
    });
    return {
      catalogs: response.data.data,
      pagination: response.data.pagination,
    };
  },

  // Get a single catalog by ID
  getCatalogById: async (catalogId: string): Promise<Catalog> => {
    const response = await axiosInstance.get<{ success: boolean; data: Catalog }>(`/catalogs/${catalogId}`);
    return response.data.data;
  },

  // Update a catalog
  updateCatalog: async (catalogId: string, data: UpdateCatalogInput): Promise<Catalog> => {
    const formData = new FormData();

    if (data.file) {
      formData.append('file', data.file);
    }
    if (data.name !== undefined) {
      formData.append('name', data.name);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description);
    }
    if (data.category !== undefined) {
      formData.append('category', data.category);
    }
    if (data.whatsappTemplate !== undefined) {
      formData.append('whatsappTemplate', data.whatsappTemplate);
    }
    if (data.emailTemplate !== undefined) {
      formData.append('emailTemplate', JSON.stringify(data.emailTemplate));
    }
    if (data.isActive !== undefined) {
      formData.append('isActive', String(data.isActive));
    }

    const response = await axiosInstance.put<{ success: boolean; data: Catalog; message: string }>(
      `/catalogs/${catalogId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Delete a catalog (soft delete)
  deleteCatalog: async (catalogId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/catalogs/${catalogId}`);
    return response.data;
  },

  // ==========================================
  // ASSIGNMENT OPERATIONS
  // ==========================================

  // Assign catalog to license key(s)
  assignToLicenseKeys: async (
    catalogId: string,
    assignments: AssignedLicenseKey[]
  ): Promise<Catalog> => {
    const response = await axiosInstance.post<{ success: boolean; data: Catalog; message: string }>(
      `/catalogs/${catalogId}/assign`,
      { assignments }
    );
    return response.data.data;
  },

  // Unassign catalog from license key(s)
  unassignFromLicenseKeys: async (
    catalogId: string,
    assignments: AssignedLicenseKey[]
  ): Promise<Catalog> => {
    const response = await axiosInstance.post<{ success: boolean; data: Catalog; message: string }>(
      `/catalogs/${catalogId}/unassign`,
      { assignments }
    );
    return response.data.data;
  },

  // ==========================================
  // UTILITY OPERATIONS
  // ==========================================

  // Get catalog categories
  getCategories: async (): Promise<CategoryOption[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: CategoryOption[] }>('/catalogs/categories');
    return response.data.data;
  },

  // Get catalog stats for dashboard
  getStats: async (): Promise<CatalogStats> => {
    const response = await axiosInstance.get<{ success: boolean; data: CatalogStats }>('/catalogs/stats');
    return response.data.data;
  },

  // Get available license keys for assignment
  getAvailableLicenseKeys: async (catalogId?: string): Promise<AvailableLicenseKey[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: AvailableLicenseKey[] }>('/catalogs/available-license-keys', {
      params: catalogId ? { catalogId } : {},
    });
    return response.data.data;
  },

  // Get catalogs for a specific license key (for lead details)
  getCatalogsForLicenseKey: async (licenseKey: string): Promise<Catalog[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: Catalog[] }>(
      `/catalogs/by-license-key/${licenseKey}`
    );
    return response.data.data;
  },

  // Preview template with sample data
  previewTemplate: async (
    template: string,
    templateType: 'whatsapp' | 'email',
    data?: TemplatePreviewData
  ): Promise<TemplatePreviewResponse> => {
    const response = await axiosInstance.post<{ success: boolean; data: TemplatePreviewResponse }>('/catalogs/preview-template', {
      template,
      templateType,
      data,
    });
    return response.data.data;
  },
};

export default catalogAPI;
