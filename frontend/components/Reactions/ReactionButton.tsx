'use client';
import React, { useState, useEffect } from 'react';
import { ThumbsUp, Heart, Smile, CheckCircle, Zap, Frown } from 'lucide-react';
import api from '@/utils/api';

// Simple mapping for icons. For "Facebook-style", we ideally use colored SVGs or Emojis.
// Let's use Emojis for simplicity and color, or Lucide icons with colors.
const REACTION_TYPES = [
    { type: 'like', label: 'Like', icon: ThumbsUp, color: 'text-blue-500' },
    { type: 'love', label: 'Love', icon: Heart, color: 'text-red-500' },
    { type: 'haha', label: 'Haha', icon: Smile, color: 'text-yellow-500' },
    { type: 'wow', label: 'Wow', icon: Zap, color: 'text-orange-500' }, // Substitute for Wow
    { type: 'sad', label: 'Sad', icon: Frown, color: 'text-yellow-600' },
    // { type: 'angry', label: 'Angry', icon: Frown, color: 'text-red-600' }
];

interface ReactionButtonProps {
    postId: number;
    initialCounts?: Record<string, number>;
    // currentReaction?: string; // If we prefetch user reaction
}

export default function ReactionButton({ postId, initialCounts = {} }: ReactionButtonProps) {
    const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
    const [myReaction, setMyReaction] = useState<string | null>(null);
    const [showDock, setShowDock] = useState(false);
    const [referenceId, setReferenceId] = useState<string>('');

    // Load/Generate Guest ID (Fingerprint)
    useEffect(() => {
        let finger = localStorage.getItem('guest_fingerprint');
        if (!finger) {
            finger = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('guest_fingerprint', finger);
        }
        setReferenceId(finger);
    }, []);

    const handleReact = async (type: string) => {
        if (!referenceId) return;

        // Optimistic UI
        const oldReaction = myReaction;
        const oldCounts = { ...counts };

        // Logic check for local update
        let newCounts = { ...counts };
        if (oldReaction === type) {
            // Toggle Off
            setMyReaction(null);
            newCounts[type] = Math.max(0, (newCounts[type] || 0) - 1);
        } else {
            // Switch
            if (oldReaction) {
                 newCounts[oldReaction] = Math.max(0, (newCounts[oldReaction] || 0) - 1);
            }
            setMyReaction(type);
            newCounts[type] = (newCounts[type] || 0) + 1;
        }
        setCounts(newCounts);
        setShowDock(false);

        try {
            const res = await api.post('/reactions', {
                post_id: postId,
                reference_id: referenceId,
                type: type
            });
            // Result: { my_reaction: "...", counts: {...} }
            setMyReaction(res.data.my_reaction);
            setCounts(res.data.counts);
        } catch (error) {
            console.error("Reaction failed", error);
            // Revert
            setMyReaction(oldReaction);
            setCounts(oldCounts);
        }
    };

    const currentReactionConfig = REACTION_TYPES.find(r => r.type === myReaction);
    const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div className="relative group" onMouseLeave={() => setShowDock(false)}>
            {/* Dock */}
            <div 
                className={`absolute bottom-full left-0 mb-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] shadow-xl rounded-full p-2 flex gap-2 transition-all duration-300 transform origin-bottom-left ${showDock || 'group-hover:scale-100 group-hover:opacity-100 opacity-0 scale-75 pointer-events-none group-hover:pointer-events-auto'}`}
            >
                {REACTION_TYPES.map((r) => (
                    <button
                        key={r.type}
                        onClick={() => handleReact(r.type)}
                        className="p-2 hover:scale-125 transition-transform text-2xl relative group/icon"
                        title={r.label}
                    >
                         {/* We can use real icons or emojis. Emojis are easiest for "Facebook style" */}
                         {/* Simple Emoji mapping */}
                         {r.type === 'like' && '👍'}
                         {r.type === 'love' && '❤️'}
                         {r.type === 'haha' && '😆'}
                         {r.type === 'wow' && '😮'}
                         {r.type === 'sad' && '😢'}
                         {r.type === 'angry' && '😡'}
                    </button>
                ))}
            </div>

            {/* Main Button */}
            <button 
                onClick={() => handleReact(myReaction || 'like')} // Default tap = Like/Unlike
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    myReaction 
                    ? `bg-blue-50 dark:bg-blue-900/20 ${currentReactionConfig?.color}` 
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#252525]'
                }`}
                onMouseEnter={() => setShowDock(true)}
            >
                {currentReactionConfig ? (
                    <currentReactionConfig.icon size={18} className={currentReactionConfig.color} />
                ) : (
                    <ThumbsUp size={18} />
                )}
                <span className="font-semibold text-sm">
                    {currentReactionConfig ? currentReactionConfig.label : 'Like'}
                </span>
                {totalReactions > 0 && (
                     <span className="text-xs ml-1 opacity-70">({totalReactions})</span>
                )}
            </button>
        </div>
    );
}
