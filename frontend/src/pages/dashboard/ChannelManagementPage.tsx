import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// @ts-ignore
import { ChannelBrowser } from '../../components/dashboard/ChannelBrowser';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { Check, X, Trash2, Youtube, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChannelManagementPage = () => {
    const { childId } = useParams();
    const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'discover'>('approved');
    const [approved, setApproved] = useState<any[]>([]);
    const [pending, setPending] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
        fetchData();
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

    const filteredApproved = approved.filter(c =>
        c.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 space-y-8">
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Manage Channels</h1>
                    <p className="text-lg text-gray-500 mt-2">Curate a safe and engaging viewing experience.</p>
                </div>

                {/* Search Bar - Only show on Approved tab */}
                {activeTab === 'approved' && (
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search approved channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-sm"
                        />
                    </div>
                )}
            </header>

            <div className="max-w-7xl mx-auto">
                {/* Premium Tabs */}
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-200 inline-flex mb-8">
                    {['approved', 'pending', 'discover'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/10 rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2 capitalize">
                                {tab}
                                {tab === 'pending' && pending.length > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                                        {pending.length}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="min-h-[400px]"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Approved Channels Grid */}
                                {activeTab === 'approved' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredApproved.map((channel) => (
                                            <div key={channel.id} className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <button
                                                    onClick={() => handleRemove(channel.channel_id)}
                                                    className="absolute top-3 right-3 p-2 bg-white/50 backdrop-blur text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                    title="Remove Channel"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-gray-50 to-gray-100 mb-4 shadow-inner">
                                                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                                            {channel.channel_thumbnail_url ? (
                                                                <img src={channel.channel_thumbnail_url} alt={channel.channel_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                                    <Youtube className="w-8 h-8 text-red-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 className="font-bold text-gray-900 text-lg text-center mb-1 line-clamp-1">{channel.channel_name}</h3>
                                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                        Safe Listed
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredApproved.length === 0 && (
                                            <div className="col-span-full py-20 text-center">
                                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Search className="w-10 h-10 text-gray-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">No channels found</h3>
                                                <p className="text-gray-500">
                                                    {searchQuery ? `No matches for "${searchQuery}"` : "You haven't approved any channels yet."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pending Requests List */}
                                {activeTab === 'pending' && (
                                    <div className="max-w-3xl mx-auto space-y-4">
                                        {pending.map((req) => (
                                            <div key={req.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-6">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-16 h-16 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center flex-shrink-0">
                                                        {req.channel_thumbnail ? (
                                                            <img src={req.channel_thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                                                        ) : (
                                                            <Youtube className="w-8 h-8 text-yellow-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-900 mb-1">{req.channel_name}</h4>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <span>Requested by Child</span>
                                                            <span>•</span>
                                                            <span className="text-gray-400">{new Date(req.created_at || Date.now()).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 self-end sm:self-center">
                                                    <button
                                                        onClick={() => handleReject(req.id)}
                                                        className="px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm shadow-primary/20 hover:shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                                                    >
                                                        <Check size={16} /> Approve
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {pending.length === 0 && (
                                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                                    <Check size={32} />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                                                <p className="text-gray-500">No pending channel requests from your child.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Discover Tab */}
                                {activeTab === 'discover' && (
                                    <ChannelBrowser childId={childId!} refresh={fetchData} />
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
