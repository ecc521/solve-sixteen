import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export function WordCard({ id, text, category, isOverlay }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: id,
        data: { text, category }
    });

    const style = {
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        backgroundColor: '#efece5',
        padding: '0.25rem', // Tight padding
        borderRadius: '8px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        userSelect: 'none',
        boxShadow: isOverlay ? '0 8px 16px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
        zIndex: isOverlay ? 999 : 'auto',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none', // Important for touch devices
        fontSize: '0.7rem', // Ensure text fits
        lineHeight: '1.1',
        boxSizing: 'border-box'
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="word-card">
            {text}
        </div>
    );
}

export default WordCard;
