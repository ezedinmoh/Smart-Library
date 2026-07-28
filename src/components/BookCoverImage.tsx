"use client";

import { useState } from "react";

interface Props {
    src: string | null | undefined;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    /** Rendered when src is missing or fails to load */
    fallback?: React.ReactNode;
}

/**
 * Drop-in replacement for <img> for book covers.
 * Falls back to the placeholder if the image URL is missing or returns an error (e.g. Cloudinary 404).
 */
export default function BookCoverImage({ src, alt, className, style, fallback }: Props) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return <>{fallback ?? null}</>;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            style={style}
            onError={() => setFailed(true)}
        />
    );
}
