import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { AlertCircle, CheckCircle, Clock, Server, Shield, Baby, FileText, LayoutDashboard, Monitor, Search, Play } from 'lucide-react';

interface TestResult {
    category: 'System' | 'Parent' | 'Child' | 'Feature';
    name: string;
    endpoint: string;
    status: 'pending' | 'success' | 'error' | 'skipped';
    message?: string;
    latency?: number;
}

const ApiTestPage = () => {
    const [results, setResults] = useState<TestResult[]>([
        // System
        { category: 'System', name: 'Backend Health', endpoint: '/health', status: 'pending' },

        // Parent Scope
        { category: 'Parent', name: 'Parent Profile', endpoint: '/parents/me', status: 'pending' },
        { category: 'Parent', name: 'Onboarding Status', endpoint: 'PUT /parents/onboarding', status: 'pending' }, // Minimal check
        { category: 'Parent', name: 'List Children', endpoint: '/children', status: 'pending' },
        { category: 'Parent', name: 'Dashboard Stats', endpoint: '/parents/dashboard/stats', status: 'pending' },
        { category: 'Parent', name: 'Dashboard Activity', endpoint: '/parents/dashboard/activity', status: 'pending' },
        { category: 'Parent', name: 'Device List', endpoint: '/devices', status: 'pending' },
        { category: 'Parent', name: 'Content Filters', endpoint: '/filters', status: 'pending' },
        { category: 'Parent', name: 'Screen Time Settings', endpoint: '/screentime/settings', status: 'pending' },
        { category: 'Parent', name: 'Notifications', endpoint: '/notifications', status: 'pending' },
        { category: 'Parent', name: 'Weekly Reports', endpoint: '/reports/weekly', status: 'pending' },

        // Child Scope
        { category: 'Child', name: 'Child Status', endpoint: '/children/:id/status', status: 'pending' },
        { category: 'Child', name: 'Approved Channels', endpoint: '/channels/approved/me', status: 'pending' }, // Updated
        { category: 'Child', name: 'Watch History', endpoint: '/watch/history/me', status: 'pending' }, // Updated

        // Features (Child Context)
        { category: 'Feature', name: 'Recs: Personalized', endpoint: '/recommendations/:id/personalized', status: 'pending' },
        { category: 'Feature', name: 'Recs: Educational', endpoint: '/recommendations/:id/educational', status: 'pending' },
        { category: 'Feature', name: 'Recs: Trending', endpoint: '/recommendations/:id/trending', status: 'pending' },
        { category: 'Feature', name: 'Safe Search', endpoint: '/search?q=test', status: 'pending' },
    ]);

    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev]);
    };

    const updateResult = useCallback((index: number, status: 'success' | 'error' | 'skipped', message?: string, latency?: number) => {
        setResults(prev => {
            const next = [...prev];
            next[index] = { ...next[index], status, message, latency };
            return next;
        });
        if (status === 'error') addLog(`ERROR: ${results[index].name} failed. ${message}`);
        else if (status === 'success') addLog(`SUCCESS: ${results[index].name}.`);
    }, [results]);

    const runTests = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setLogs([]);
        addLog('Starting Comprehensive API Tests...');

        // Reset
        setResults(prev => prev.map(r => ({ ...r, status: 'pending', message: '', latency: undefined })));

        const parentToken = localStorage.getItem('token');
        const childToken = localStorage.getItem('safeguard_token');
        const activeChildId = localStorage.getItem('activeChildId');

        addLog(`Context: Parent=${!!parentToken}, Child=${!!childToken} (ID: ${activeChildId || 'None'})`);

        for (let i = 0; i < results.length; i++) {
            const test = results[i];
            const start = performance.now();

            // Skip logic
            if (test.category === 'Parent' && !parentToken) {
                updateResult(i, 'skipped', 'No Parent Token');
                continue;
            }
            if ((test.category === 'Child' || test.category === 'Feature') && (!childToken || !activeChildId)) {
                updateResult(i, 'skipped', 'No Child Session');
                continue;
            }

            try {
                let url = test.endpoint;

                // Dynamic URL replacement
                if (url.includes(':id') && activeChildId) {
                    url = url.replace(':id', activeChildId);
                }

                // Special handling for PUT
                if (url.startsWith('PUT')) {
                    // Skip actual mutation, just logging
                    updateResult(i, 'skipped', 'Skipping mutation');
                    continue;
                }

                addLog(`Testing ${test.name} (${url})...`);

                await api.get(url);
                const latency = Math.round(performance.now() - start);
                updateResult(i, 'success', 'OK', latency);

            } catch (e: any) {
                const status = e.response?.status;
                if (status === 404) {
                    updateResult(i, 'error', '404: Endpoint Not Found');
                } else if (status === 401 || status === 403) {
                    updateResult(i, 'error', `${status}: Unauthorized`);
                } else {
                    updateResult(i, 'error', e.message);
                }
            }

            // Small delay to prevent rate limits
            await new Promise(r => setTimeout(r, 100));
        }

        setIsRunning(false);
        addLog('All Tests Completed.');
    };

    useEffect(() => {
        runTests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getIcon = (category: string) => {
        switch (category) {
            case 'System': return <Server className="w-5 h-5" />;
            case 'Parent': return <Shield className="w-5 h-5" />;
            case 'Child': return <Baby className="w-5 h-5" />;
            case 'Feature': return <Play className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Results Column */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8" />
                            <div>
                                <h1 className="text-2xl font-bold">System Diagnostics</h1>
                                <p className="text-indigo-100 text-sm">Comprehensive API Coverage</p>
                            </div>
                        </div>
                        <button
                            onClick={runTests}
                            disabled={isRunning}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isRunning ? 'Running...' : 'Re-run'}
                        </button>
                    </div>

                    <div className="p-0 overflow-auto max-h-[70vh]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Test Name</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Latency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {results.map((result, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                                                {getIcon(result.category)}
                                                {result.category}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{result.name}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{result.endpoint}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.status === 'success' ? 'bg-green-100 text-green-800' :
                                                result.status === 'error' ? 'bg-red-100 text-red-800' :
                                                    result.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {result.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {result.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                                                {result.status === 'skipped' && <Clock className="w-3 h-3 mr-1" />}
                                                {result.status.toUpperCase()}
                                                {result.message && <span className="ml-2 opacity-75">- {result.message}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-xs text-gray-400">
                                            {result.latency ? `${result.latency}ms` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Logs Column */}
                <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[70vh]">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-gray-200 font-mono font-bold flex items-center gap-2">
                            <Monitor className="w-4 h-4" /> Live Terminal
                        </h2>
                        <span className="text-xs text-gray-500">{logs.length} lines</span>
                    </div>
                    <div className="flex-1 p-4 font-mono text-xs overflow-auto space-y-1.5 custom-scrollbar">
                        {logs.length === 0 && <span className="text-gray-600 italic">Ready to start...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className={`border-b border-gray-800 pb-1 mb-1 last:border-0 border-opacity-30 ${log.includes('ERROR') ? 'text-red-400' :
                                log.includes('SUCCESS') ? 'text-green-400' :
                                    log.includes('Context') ? 'text-blue-400' :
                                        'text-gray-300'
                                }`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-gray-400 text-sm">
                Host: {window.location.host} • API: {api.getUri()}
            </div>
        </div>
    );
};

export default ApiTestPage;
