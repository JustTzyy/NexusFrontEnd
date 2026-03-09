/**
 * Reusable Filter Utilities
 * Provides common filtering logic for tables and lists
 */

/**
 * Filter data by search query across multiple fields
 * @param {Array} data - Array of objects to filter
 * @param {string} query - Search query string
 * @param {Array<string>} searchFields - Fields to search in
 * @returns {Array} Filtered data
 */
export const filterBySearch = (data, query, searchFields = []) => {
  if (!query || !query.trim()) return data;
  
  const searchTerm = query.trim().toLowerCase();
  
  return data.filter((item) => {
    return searchFields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm);
    });
  });
};

/**
 * Filter data by date range
 * @param {Array} data - Array of objects to filter
 * @param {Date|null} fromDate - Start date
 * @param {Date|null} toDate - End date
 * @param {string} dateField - Field name containing the date
 * @returns {Array} Filtered data
 */
export const filterByDateRange = (data, fromDate, toDate, dateField = 'createdAt') => {
  if (!fromDate && !toDate) return data;
  
  return data.filter((item) => {
    const itemDate = new Date(item[dateField]);
    
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (itemDate < from) return false;
    }
    
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (itemDate > to) return false;
    }
    
    return true;
  });
};

/**
 * Filter data by a specific field value
 * @param {Array} data - Array of objects to filter
 * @param {string} field - Field name to filter by
 * @param {any} value - Value to match (use "all" to skip filtering)
 * @param {boolean} caseInsensitive - Whether to ignore case
 * @returns {Array} Filtered data
 */
export const filterByField = (data, field, value, caseInsensitive = true) => {
  if (!value || value === 'all') return data;
  
  return data.filter((item) => {
    const itemValue = item[field];
    if (itemValue === null || itemValue === undefined) return false;
    
    if (caseInsensitive) {
      return String(itemValue).toLowerCase() === String(value).toLowerCase();
    }
    
    return itemValue === value;
  });
};

/**
 * Apply multiple filters to data
 * @param {Array} data - Array of objects to filter
 * @param {Object} filters - Filter configuration
 * @param {string} filters.search - Search query
 * @param {Array<string>} filters.searchFields - Fields to search in
 * @param {Date|null} filters.fromDate - Start date
 * @param {Date|null} filters.toDate - End date
 * @param {string} filters.dateField - Date field name
 * @param {Object} filters.fields - Additional field filters { fieldName: value }
 * @returns {Array} Filtered data
 */
export const applyFilters = (data, filters = {}) => {
  let result = [...data];
  
  // Apply search filter
  if (filters.search && filters.searchFields) {
    result = filterBySearch(result, filters.search, filters.searchFields);
  }
  
  // Apply date range filter
  if (filters.fromDate || filters.toDate) {
    result = filterByDateRange(
      result,
      filters.fromDate,
      filters.toDate,
      filters.dateField || 'createdAt'
    );
  }
  
  // Apply field filters
  if (filters.fields) {
    Object.entries(filters.fields).forEach(([field, value]) => {
      result = filterByField(result, field, value);
    });
  }
  
  return result;
};

/**
 * Paginate filtered data
 * @param {Array} data - Array of data to paginate
 * @param {number} page - Current page (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Object} Paginated result with data and metadata
 */
export const paginate = (data, page = 1, pageSize = 10) => {
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);
  
  return {
    data: paged,
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
};

/**
 * Get unique values from a field across all data
 * @param {Array} data - Array of objects
 * @param {string} field - Field name to extract values from
 * @param {boolean} sorted - Whether to sort the results
 * @returns {Array} Unique values
 */
export const getUniqueValues = (data, field, sorted = true) => {
  const values = new Set(data.map((item) => item[field]).filter(Boolean));
  const result = Array.from(values);
  return sorted ? result.sort() : result;
};
