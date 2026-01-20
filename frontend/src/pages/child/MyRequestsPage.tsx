import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ApprovalService, ApprovalRequest } from '../../services/approval.service';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDistanceToNow } from 'date-fns';

export const MyRequestsPage = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await ApprovalService.getHistory();
            setRequests(data);
        } catch (err) {
            console.error('Failed to load requests', err);
        } finally {
            setIsLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700'
        };

        const labels = {
            pending: 'Waiting for Parent',
            approved: 'Approved',
            rejected: 'Declined'
        };

        const icons = {
            pending: <Clock size={14} />,
            approved: <CheckCircle size={14} />,
            rejected: <XCircle size={14} />
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
                {icons[status as keyof typeof icons]}
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">My Requests</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-24 w-full rounded-2xl" variant="rectangular" />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <EmptyState
                        title="No Requests Yet"
                        description="When you ask to watch a blocked video, your requests will appear here."
                        imageSrc="/assets/empty-requests.png" // Placeholder, will rely on generic icon fallback if missing
                        icon={Clock}
                    />
                ) : (
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                                {/* Thumbnail */}
                                <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    {req.thumbnail_url ? (
                                        <img src={req.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <span className="text-xs">No Image</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{req.video_title || 'Unknown Video'}</h3>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{req.channel_name || 'Unknown Channel'}</p>
                                    <p className="text-xs text-gray-400">
                                        Requested {formatDistanceToNow(new Date(req.requested_at))} ago
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
