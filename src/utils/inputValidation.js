/**
 * Input validation utilities for form fields
 * Provides reusable functions to sanitize and validate input values
 */

/**
 * Sanitizes input to allow only letters and spaces (no numbers or special characters)
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized value with only letters and spaces
 */
export const lettersOnly = (value) => {
    return value.replace(/[^a-zA-Z\s]/g, '');
};

/**
 * Sanitizes input to allow only letters, spaces, and dots
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized value with only letters, spaces, and dots
 */
export const lettersAndDotsOnly = (value) => {
    return value.replace(/[^a-zA-Z\s.]/g, '');
};

/**
 * Sanitizes input to allow only numbers
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized value with only numbers
 */
export const numbersOnly = (value) => {
    return value.replace(/[^0-9]/g, '');
};

/**
 * Sanitizes input to allow only alphanumeric characters (letters and numbers)
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized value with only letters and numbers
 */
export const alphanumericOnly = (value) => {
    return value.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Sanitizes input to allow only alphanumeric characters and spaces
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized value with only letters, numbers, and spaces
 */
export const alphanumericWithSpaces = (value) => {
    return value.replace(/[^a-zA-Z0-9\s]/g, '');
};

/**
 * Sanitizes input for email format (letters, numbers, @, ., -, _)
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized value for email
 */
export const emailCharsOnly = (value) => {
    return value.replace(/[^a-zA-Z0-9@._-]/g, '');
};

/**
 * Sanitizes input for phone numbers (numbers, +, -, spaces, parentheses)
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized value for phone
 */
export const phoneCharsOnly = (value) => {
    return value.replace(/[^0-9+\-\s()]/g, '');
};

/**
 * Sanitizes and validates Philippine phone numbers
 * - Only allows numeric digits
 * - Limits to 11 digits
 * - Ensures number starts with "09"
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized Philippine phone number
 */
export const philippinePhoneNumber = (value) => {
    // Remove all non-numeric characters
    let cleaned = value.replace(/[^0-9]/g, '');

    // If empty or only "0", allow it (for user to start typing)
    if (cleaned.length === 0) return '';
    if (cleaned.length === 1 && cleaned === '0') return '0';

    // Enforce "09" prefix
    if (cleaned.length >= 1 && cleaned[0] !== '0') {
        cleaned = '0' + cleaned;
    }
    if (cleaned.length >= 2 && cleaned.substring(0, 2) !== '09') {
        cleaned = '09' + cleaned.substring(1);
    }

    // Limit to 11 digits
    if (cleaned.length > 11) {
        cleaned = cleaned.substring(0, 11);
    }

    return cleaned;
};


/**
 * Creates a custom sanitizer with allowed characters
 * @param {string} allowedPattern - Regex pattern of allowed characters (without brackets)
 * @returns {function} - Sanitizer function
 */
export const createSanitizer = (allowedPattern) => {
    const regex = new RegExp(`[^${allowedPattern}]`, 'g');
    return (value) => value.replace(regex, '');
};

/**
 * Handler wrapper for onChange that applies sanitization
 * @param {function} sanitizer - Sanitizer function to apply
 * @param {function} onChange - Original onChange handler
 * @returns {function} - Wrapped onChange handler
 */
export const withSanitizer = (sanitizer, onChange) => {
    return (e) => {
        const sanitizedValue = sanitizer(e.target.value);
        onChange({ ...e, target: { ...e.target, value: sanitizedValue } });
    };
};
