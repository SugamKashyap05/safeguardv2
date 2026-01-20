import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { PlaylistItem } from '../../types/playlist';

interface SortableVideoItemProps {
    item: PlaylistItem;
    index: number;
    onRemove: (videoId: string) => void;
}

export const SortableVideoItem = ({ item, index, onRemove }: SortableVideoItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl group transition-colors bg-white"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 touch-none"
            >
                <GripVertical size={20} />
            </button>
            <span className="font-bold text-gray-300 w-6 text-center">{index + 1}</span>
            <img src={item.video_metadata.thumbnail} className="w-24 h-16 object-cover rounded-xl bg-gray-200" alt="" />
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate">{item.video_metadata.title}</h4>
                <p className="text-xs text-gray-500">{item.video_metadata.channelTitle}</p>
            </div>
            <button
                onClick={() => onRemove(item.video_id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};
