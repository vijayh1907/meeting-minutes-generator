// API Configuration
export const API_CONFIG = {
  // Base URL for all API endpoints
  BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000',
  
  // API endpoints
  ENDPOINTS: {
    GENERATE_MINUTES: '/api/meetings/generate-minutes',
    GET_MEETINGS: '/api/meetings',
    GET_PARTICIPANTS: '/api/participants',
    UPLOAD_MEETING_FILES: '/api/upload_meeting_files',
    SUBMIT_REVIEWED_DATA: '/review_content_classify',
    REVIEW_AND_ASSIGN_ACTION_ITEMS: '/api/review_and_assign_action_items',
    REVIEW_AND_FINALIZE_MOM: '/api/review_and_finalize_mom',
    // Add other endpoints here as needed
    // UPDATE_MEETING: '/api/meetings/:id',
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 30000,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get endpoint by key
export const getApiEndpoint = (key: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return API_CONFIG.ENDPOINTS[key];
};
