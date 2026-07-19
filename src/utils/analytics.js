/**
 * analytics.js
 * Handles GA4 event tracking with graceful fallbacks.
 */

// A helper function to create an anonymized hash of the user ID, or return a session ID
async function getAnonymizedUserId(userId) {
    if (!userId) return 'anonymous_' + Math.random().toString(36).substring(2, 11);
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(userId);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex.substring(0, 16);
    } catch (e) {
        // Fallback if crypto is unavailable
        return 'hashed_' + userId.substring(0, 8);
    }
}

export const trackEvent = async (eventName, params = {}) => {
    try {
        if (typeof window === 'undefined') return;
        
        let userId = params.userId || null;
        if (userId) {
            userId = await getAnonymizedUserId(userId);
            delete params.userId; // Remove raw user ID for privacy
        }

        const eventParams = {
            ...params,
            ...(userId && { hashed_user_id: userId }),
            timestamp: new Date().toISOString()
        };

        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, eventParams);
        } else {
            // GA4 not loaded or adblocker enabled. 
            // Graceful fallback: just log to console in dev mode
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Analytics] Tracked ${eventName}:`, eventParams);
            }
        }
    } catch (error) {
        // Absolute safety fallback: Do not break the main UI logic.
        console.error('Analytics tracking error:', error);
    }
};
