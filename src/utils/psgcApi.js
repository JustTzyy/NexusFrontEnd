/**
 * Philippine Standard Geographic Code (PSGC) API Utilities
 * API Documentation: https://psgc.cloud/
 */

const PSGC_BASE_URL = "https://psgc.cloud/api";

/**
 * Fetch all Philippine regions
 * @returns {Promise<Array>} Array of regions with {name, code}
 */
export const fetchRegions = async () => {
    try {
        const response = await fetch(`${PSGC_BASE_URL}/regions`);
        if (!response.ok) throw new Error("Failed to fetch regions");
        return await response.json();
    } catch (error) {
        console.error("Error fetching regions:", error);
        throw error;
    }
};

/**
 * Fetch provinces by region code
 * @param {string} regionCode - The region code (e.g., "1300000000" for NCR)
 * @returns {Promise<Array>} Array of provinces with {name, code}
 */
export const fetchProvinces = async (regionCode) => {
    try {
        const response = await fetch(`${PSGC_BASE_URL}/regions/${regionCode}/provinces`);
        if (!response.ok) throw new Error("Failed to fetch provinces");
        return await response.json();
    } catch (error) {
        console.error("Error fetching provinces:", error);
        throw error;
    }
};

/**
 * Fetch cities/municipalities by province code
 * @param {string} provinceCode - The province code
 * @returns {Promise<Array>} Array of cities/municipalities with {name, code}
 */
export const fetchCities = async (provinceCode) => {
    try {
        const response = await fetch(`${PSGC_BASE_URL}/provinces/${provinceCode}/cities-municipalities`);
        if (!response.ok) throw new Error("Failed to fetch cities");
        return await response.json();
    } catch (error) {
        console.error("Error fetching cities:", error);
        throw error;
    }
};

/**
 * Fetch barangays by city/municipality code
 * @param {string} cityCode - The city/municipality code
 * @returns {Promise<Array>} Array of barangays with {name, code}
 */
export const fetchBarangays = async (cityCode) => {
    try {
        const response = await fetch(`${PSGC_BASE_URL}/cities-municipalities/${cityCode}/barangays`);
        if (!response.ok) throw new Error("Failed to fetch barangays");
        return await response.json();
    } catch (error) {
        console.error("Error fetching barangays:", error);
        throw error;
    }
};

/**
 * Custom hook for managing PSGC address selection
 * Can be used in React components
 */
export const usePSGCAddress = () => {
    // This is a helper structure for use with React hooks
    // Components can adapt this to their useState/useEffect patterns
    return {
        fetchRegions,
        fetchProvinces,
        fetchCities,
        fetchBarangays,
    };
};
