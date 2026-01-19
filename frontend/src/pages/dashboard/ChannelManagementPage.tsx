import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// @ts-ignore
import { ChannelBrowser } from '../../components/dashboard/ChannelBrowser';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { Check, X, Trash2, Youtube } from 'lucide-react';

export const ChannelManagementPage = () => {
    const { childId } = useParams();
    const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'discover'>('approved');
    const [approved, setApproved] = useState<any[]>([]);
    const [pending, setPending] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [childId, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'approved') {
                const res = await api.get(`/channels/approved/${childId}`);
                setApproved(res.data.data);
            } else if (activeTab === 'pending') {
                const res = await api.get(`/channels/pending/${childId}`);
                setPending(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        await api.post('/channels/approve', { requestId });
        fetchData(); // Refresh
        // Toast success
    };

    const handleReject = async (requestId: string) => {
        await api.post('/channels/reject', { requestId });
        fetchData();
    };

    const handleRemove = async (channelId: string) => {
        if (!confirm('Remove this channel?')) return;
        await api.delete(`/channels/${channelId}/${childId}`);
        fetchData();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Manage Channels</h1>
                <p className="text-gray-500">Curate the perfect viewing list for your child</p>
            </header>

            <div className="flex gap-4 border-b border-gray-200">
                {['approved', 'pending', 'discover'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 px-2 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        {tab} {tab === 'pending' && pending.length > 0 && <span className="ml-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{pending.length}</span>}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {loading ? (
                    <div className="text-center text-gray-400 py-12">Loading...</div>
                ) : (
                    <>
                        {/* Approved List */}
                        {activeTab === 'approved' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {approved.map(channel => (
                                    <div key={channel.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center relative group">
                                        <button
                                            onClick={() => handleRemove(channel.channel_id)}
                                            className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="w-16 h-16 rounded-full bg-gray-100 mb-3 overflow-hidden">
                                            {channel.channel_thumbnail_url ? (
                                                <img src={channel.channel_thumbnail_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Youtube className="w-full h-full p-4 text-red-500" />
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-800 line-clamp-1">{channel.channel_name}</h3>
                                        <p className="text-xs text-gray-400 mt-1">Approved by You</p>
                                    </div>
                                ))}
                                {approved.length === 0 && <div className="col-span-full text-center text-gray-400 py-12">No channels approved yet. Check the Discovery tab!</div>}
                            </div>
                        )}

                        {/* Pending Requests */}
                        {activeTab === 'pending' && (
                            <div className="space-y-4 max-w-2xl mx-auto">
                                {pending.map(req => (
                                    <div key={req.id} className="bg-white rounded-2xl p-6 border border-yellow-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 font-bold">
                                                ?
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{req.channel_name}</h4>
                                                <p className="text-sm text-gray-500">Requested by Child</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                                                title="Reject"
                                            >
                                                <X size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center gap-2"
                                            >
                                                <Check size={16} /> Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {pending.length === 0 && <div className="text-center text-gray-400 py-12">No pending requests.</div>}
                            </div>
                        )}

                        {/* Discovery */}
                        {activeTab === 'discover' && (
                            <ChannelBrowser childId={childId!} refresh={fetchData} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
