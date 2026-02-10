
import React, { useState, useEffect } from 'react';
import { api } from './api';
import type { VersionInfo } from './types';

const Footer: React.FC = () => {
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

    useEffect(() => {
        api.getAppVersion().then(setVersionInfo);
    }, []);

    return (
        <footer className="bg-slate-800/50 border-t border-slate-700">
            <div className="container mx-auto px-4 py-4 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} BK Academy. All rights reserved.</p>
                {versionInfo && <p className="text-xs text-slate-500 mt-1">Version: {versionInfo.version}</p>}
            </div>
        </footer>
    );
};

export default Footer;
