"use client";

import { useState } from "react";

export default function Logo({ size = 80 }) {
    const [error, setError] = useState(false);

    // If user has uploaded a logo.png, we'll try to show it first
    if (!error) {
        return (
            <img
                src="/brand/logo.png"
                alt="Campus Connect Logo"
                width={size}
                height={size}
                style={{ objectFit: 'contain' }}
                onError={() => setError(true)}
            />
        );
    }

    // Fallback to the beautiful SVG monogram
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Campus Connect Logo"
        >
            <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#006633" />
                    <stop offset="50%" stopColor="#00994d" />
                    <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
                <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#006633" />
                </linearGradient>
                <filter id="logo-glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Outer ring */}
            <circle
                cx="60"
                cy="60"
                r="56"
                stroke="url(#ring-gradient)"
                strokeWidth="2.5"
                fill="none"
                opacity="0.6"
            />

            {/* Inner background circle */}
            <circle cx="60" cy="60" r="48" fill="#0f1724" />

            {/* CC Monogram */}
            <text
                x="60"
                y="67"
                textAnchor="middle"
                fontFamily="var(--font-geist-sans), Arial, sans-serif"
                fontWeight="700"
                fontSize="32"
                fill="url(#logo-gradient)"
                filter="url(#logo-glow)"
                letterSpacing="-1"
            >
                CC
            </text>
        </svg>
    );
}
