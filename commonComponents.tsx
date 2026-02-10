
import React, { ReactNode } from 'react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    isLoading?: boolean;
    size?: 'sm' | 'md';
}
export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', isLoading = false, size = 'md', ...props }) => {
    const baseClasses = 'rounded-md font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
    const variantClasses = {
        primary: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500',
        secondary: 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500',
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    };
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
    };
    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} disabled={isLoading} {...props}>
            {isLoading ? <Spinner /> : children}
        </button>
    );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
export const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
    return (
        <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>}
            <input
                id={id}
                className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                {...props}
            />
        </div>
    );
};


// --- Card ---
interface CardProps {
    children: ReactNode;
    className?: string;
}
export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className }, ref) => {
    return (
        <div ref={ref} className={`bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 ${className}`}>
            {children}
        </div>
    );
});
Card.displayName = 'Card';

// --- Modal ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl';
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className={`bg-slate-800 rounded-lg shadow-xl w-full m-4 border border-slate-700 ${sizeClasses[size]}`}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

// --- Spinner ---
export const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Badge ---
interface BadgeProps {
    color: 'green' | 'yellow' | 'red' | 'sky' | 'slate' | 'purple' | 'indigo';
    children: ReactNode;
    className?: string;
}
export const Badge: React.FC<BadgeProps> = ({ color, children, className }) => {
    const colorClasses = {
        green: 'bg-green-500/20 text-green-400',
        yellow: 'bg-yellow-500/20 text-yellow-400',
        red: 'bg-red-500/20 text-red-400',
        sky: 'bg-sky-500/20 text-sky-400',
        slate: 'bg-slate-500/20 text-slate-400',
        purple: 'bg-purple-500/20 text-purple-400',
        indigo: 'bg-indigo-500/20 text-indigo-400',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-block ${colorClasses[color]} ${className}`}>
            {children}
        </span>
    );
};

// --- ToggleSwitch ---
interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label }) => {
    return (
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
                <div className="block bg-slate-600 w-14 h-8 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6 bg-sky-400' : ''}`}></div>
            </div>
            <div className="ml-3 text-slate-300 font-medium">{label}</div>
        </label>
    );
};
