
import React from 'react';

/**
 * A utility function that finds URLs in a string and replaces them with clickable anchor tags.
 * This approach is safer than using dangerouslySetInnerHTML as it avoids XSS vulnerabilities.
 * @param text The input string to parse for links.
 * @returns A React.ReactNode containing the text with links properly formatted.
 */
export const linkify = (text: string): React.ReactNode => {
    // Regex to find URLs (http, https, www)
    const urlRegex = /(\b(https?:\/\/[^\s]+)|(www\.[^\s]+))/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (!part) return null;

        if (part.match(urlRegex)) {
            const url = part.startsWith('www.') ? `https:// ${part}` : part;
            return (
                <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline break-all"
                    title={`Click to open: ${url}`}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};
