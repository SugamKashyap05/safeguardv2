import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApprovalCard } from '../../components/approvals/ApprovalCard';

interface ApprovalRequest {
    id: string;
    child_id: string;
    request_type: 'video' | 'channel';
    video_id?: string;
    video_title?: string;
    video_thumbnail?: string;
    duration?: number;
    channel_id: string;
    channel_name?: string;
    channel_thumbnail?: string;
    status: 'pending' | 'approved' | 'rejected';
    child_message?: string;
    parent_notes?: string;
    requested_at: string;
    children?: { name: string; avatar: string };
}

export const ApprovalCenterPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const res = await api.get('/approvals/pending');
                setRequests(res.data.data.requests);
                setPendingCount(res.data.data.count);
            } else {
                const res = await api.get(`/approvals/history?status=${activeTab}`);
                setRequests(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch requests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        setActionLoading(requestId);
        try {
            await api.post(`/approvals/${requestId}/review`, { decision: 'approve' });
            fetchRequests();
        } catch (err) {
            console.error('Failed to approve', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setActionLoading(requestId);
        try {
            await api.post(`/approvals/${requestId}/review`, { decision: 'reject' });
            fetchRequests();
        } catch (err) {
            console.error('Failed to reject', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleQuickApproveChannel = async (requestId: string) => {
        setActionLoading(requestId);
        try {
            await api.post(`/approvals/${requestId}/quick-approve-channel`);
            fetchRequests();
        } catch (err) {
            console.error('Failed to quick approve', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDismiss = async (requestId: string) => {
        if (!confirm('Dismiss this request?')) return;
        setActionLoading(requestId);
        try {
            await api.delete(`/approvals/${requestId}`);
            fetchRequests();
        } catch (err) {
            console.error('Failed to dismiss', err);
        } finally {
            setActionLoading(null);
        }
    };

    const tabs = [
        { id: 'pending', label: 'Pending', icon: Clock, count: pendingCount },
        { id: 'approved', label: 'Approved', icon: CheckCircle },
        { id: 'rejected', label: 'Rejected', icon: XCircle }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/parent/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Approval Center</h1>
                            <p className="text-sm text-gray-500">Review video & channel requests</p>
                        </div>
                    </div>
                    {pendingCount > 0 && (
                        <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                            {pendingCount} pending
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Request List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            {activeTab === 'pending' ? <Clock size={32} /> : activeTab === 'approved' ? <CheckCircle size={32} /> : <XCircle size={32} />}
                        </div>
                        <p className="font-medium">No {activeTab} requests</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(request => (
                            <ApprovalCard
                                key={request.id}
                                request={request}
                                onApprove={() => handleApprove(request.id)}
                                onReject={() => handleReject(request.id)}
                                onQuickApproveChannel={() => handleQuickApproveChannel(request.id)}
                                onDismiss={() => handleDismiss(request.id)}
                                isLoading={actionLoading === request.id}
                                showActions={activeTab === 'pending'}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
