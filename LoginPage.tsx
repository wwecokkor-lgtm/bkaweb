
import React, { useState } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import { Button, Input, Card } from './commonComponents';
import { NotificationType } from './types';

interface LoginPageProps {
    logoUrl?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ logoUrl }) => {
    const { login, addNotification, setPage } = useAppStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            addNotification('Please enter email and password.', NotificationType.ERROR);
            return;
        }
        setIsLoading(true);
        const response = await api.login(email, password);
        setIsLoading(false);
        if (response.success && response.user && response.sessionId) {
            login({ user: response.user, sessionId: response.sessionId });
            addNotification(response.message, NotificationType.SUCCESS);
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };

    return (
        <div className="flex items-center justify-center w-full py-12">
            <Card className="w-full max-w-md">
                <div className="text-center mb-8">
                    {logoUrl ? (
                        <img src={logoUrl} alt="BK Academy Logo" className="w-48 mx-auto mb-4" />
                    ) : (
                        <h1 className="text-3xl font-bold text-white">BK Academy</h1>
                    )}
                    <p className="text-slate-400">Login to access your dashboard</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="email"
                        label="Email or Username"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email or username"
                        required
                    />
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Login
                    </Button>
                </form>
                <div className="text-center text-slate-400 mt-6 space-y-2">
                    <p>
                        Don't have an account?{' '}
                        <button onClick={() => setPage('register')} className="font-semibold text-sky-500 hover:text-sky-400">
                            Register here
                        </button>
                    </p>
                    <p>
                        <button onClick={() => setPage('instructorRegister')} className="font-semibold text-amber-400 hover:text-amber-300">
                           Become an Instructor
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default LoginPage;
