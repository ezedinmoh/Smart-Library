"use client";

/**
 * Floating back button — matches Django's templates/includes/back_button.html
 * Fixed bottom-left, green pill, calls window.history.back() or falls back to home.
 */
export default function BackButton({ fallback = "/" }: { fallback?: string }) {
    function goBack() {
        if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = fallback;
        }
    }

    return (
        <div className="back-button-container">
            <button onClick={goBack} className="back-btn" title="Go back to previous page">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
            </button>
        </div>
    );
}
