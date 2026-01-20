import { Play, Star, Clock, CheckCircle, XCircle, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalRequest {
    id: string;
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

interface ApprovalCardProps {
    request: ApprovalRequest;
    onApprove?: () => void;
    onReject?: () => void;
    onQuickApproveChannel?: () => void;
    onDismiss?: () => void;
    isLoading?: boolean;
    showActions?: boolean;
}

export const ApprovalCard = ({
    request,
    onApprove,
    onReject,
    onQuickApproveChannel,
    onDismiss,
    isLoading = false,
    showActions = true
}: ApprovalCardProps) => {
    const isVideo = request.request_type === 'video';
    const timeAgo = formatDistanceToNow(new Date(request.requested_at), { addSuffix: true });

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const previewUrl = isVideo
        ? `https://www.youtube.com/watch?v=${request.video_id}`
        : `https://www.youtube.com/channel/${request.channel_id}`;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Child Info */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {request.children?.avatar || request.children?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <span className="font-bold text-gray-800">{request.children?.name || 'Child'}</span>
                        <span className="text-gray-400 text-sm ml-2">{timeAgo}</span>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        request.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                    }`}>
                    {request.status === 'pending' ? <Clock size={12} className="inline mr-1" /> :
                        request.status === 'approved' ? <CheckCircle size={12} className="inline mr-1" /> :
                            <XCircle size={12} className="inline mr-1" />}
                    {request.status}
                </div>
            </div>

            {/* Child Message */}
            {request.child_message && (
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                    <p className="text-indigo-800 text-sm">
                        💬 "{request.child_message}"
                    </p>
                </div>
            )}

            {/* Content Preview */}
            <div className="p-4">
                <div className="flex gap-4">
                    <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <img
                            src={isVideo ? request.video_thumbnail : request.channel_thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        {isVideo && request.duration && (
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                                {formatDuration(request.duration)}
                            </span>
                        )}
                        {!isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                    <Play size={20} className="text-red-600 ml-1" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                            <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold ${isVideo ? 'bg-purple-100 text-purple-600' : 'bg-pink-100 text-pink-600'
                                }`}>
                                {isVideo ? 'Video' : 'Channel'}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 mt-2 line-clamp-2">
                            {isVideo ? request.video_title : request.channel_name}
                        </h3>
                        {isVideo && (
                            <p className="text-gray-500 text-sm mt-1">{request.channel_name}</p>
                        )}
                        <button
                            onClick={() => window.open(previewUrl, '_blank')}
                            className="flex items-center gap-1 text-indigo-600 text-sm font-medium mt-2 hover:underline"
                        >
                            <ExternalLink size={14} />
                            Preview on YouTube
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {showActions && request.status === 'pending' && (
                <div className="p-4 pt-0 flex flex-wrap gap-2">
                    <button
                        onClick={onReject}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        Not This Time
                    </button>
                    <button
                        onClick={onApprove}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        Approve
                    </button>
                    {isVideo && (
                        <button
                            onClick={onQuickApproveChannel}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Star size={16} />
                            Approve Channel
                        </button>
                    )}
                    <button
                        onClick={onDismiss}
                        disabled={isLoading}
                        className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Dismiss"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
