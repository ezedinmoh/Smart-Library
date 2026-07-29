"use client";

import React, { useEffect } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

/** Smooth scrolling with Lenis, matching Wearify experience. */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        let rafId = 0;
        let lenisInstance: { raf: (time: number) => void; destroy: () => void } | null = null;
        let cancelled = false;

        import("lenis").then(({ default: Lenis }) => {
            if (cancelled) return;
            lenisInstance = new Lenis({
                duration: 1.2,
                smoothWheel: true,
                easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });

            function raf(time: number) {
                lenisInstance?.raf(time);
                rafId = requestAnimationFrame(raf);
            }
            rafId = requestAnimationFrame(raf);
        }).catch(() => {
            // Non-fatal if Lenis fails to load
        });

        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
            lenisInstance?.destroy();
        };
    }, []);

    return <>{children}</>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export interface ScrollRevealProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    distance?: number;
    duration?: number;
    once?: boolean;
    className?: string;
}

/** Component that animates elements as they scroll into view */
export function ScrollReveal({
    children,
    delay = 0,
    direction = "up",
    distance = 30,
    duration = 0.7,
    once = true,
    className = "",
    ...props
}: ScrollRevealProps) {
    const getInitialOffset = () => {
        switch (direction) {
            case "up": return { y: distance, x: 0 };
            case "down": return { y: -distance, x: 0 };
            case "left": return { x: distance, y: 0 };
            case "right": return { x: -distance, y: 0 };
            case "none": return { x: 0, y: 0 };
        }
    };

    const offset = getInitialOffset();

    return (
        <motion.div
            initial={{ opacity: 0, ...offset }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once, margin: "-60px" }}
            transition={{ duration, ease: EASE, delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/** Container that staggers child items when scrolled into view */
export function StaggerContainer({
    children,
    staggerDelay = 0.1,
    className = "",
    ...props
}: {
    children: React.ReactNode;
    staggerDelay?: number;
    className?: string;
} & HTMLMotionProps<"div">) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/** Individual item inside a StaggerContainer */
export function StaggerItem({
    children,
    className = "",
    distance = 24,
    ...props
}: {
    children: React.ReactNode;
    className?: string;
    distance?: number;
} & HTMLMotionProps<"div">) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: distance },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: EASE },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}
