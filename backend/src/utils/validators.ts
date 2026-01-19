/**
 * Validates a password against strict security requirements.
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character.' };
    }
    return { valid: true };
}

/**
 * Validates a PIN against security requirements.
 * Requirements:
 * - Exactly 4 digits
 * - Not a simple sequence (1234, 4321)
 * - Not a repeated pattern (1111, 2222)
 * - Not an obvious pattern (1212)
 */
export function validatePin(pin: string): { valid: boolean; message?: string } {
    if (!/^\d{4}$/.test(pin)) {
        return { valid: false, message: 'PIN must be exactly 4 digits.' };
    }

    // Check for repeated digits (1111)
    if (/^(\d)\1+$/.test(pin)) {
        return { valid: false, message: 'PIN cannot be all repeated digits (e.g., 1111).' };
    }

    // Check for simple sequences
    const sequences = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
    if (sequences.includes(pin)) {
        return { valid: false, message: 'PIN cannot be a simple sequence (e.g., 1234).' };
    }

    // Check for repetitive patterns of 2 (1010, 1212)
    const firstTwo = pin.substring(0, 2);
    const lastTwo = pin.substring(2, 4);
    if (firstTwo === lastTwo) {
        return { valid: false, message: 'PIN cannot be a repetitive pattern (e.g., 1212).' };
    }


    return { valid: true };
}
