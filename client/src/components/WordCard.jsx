import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export function WordCard({ id, text, category, isOverlay }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { text, category }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        backgroundColor: '#efece5',
        padding: '1rem',
        borderRadius: '12px',
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
        touchAction: 'none' // Important for touch devices
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="word-card">
            {text}
        </div>
    );
}

export default WordCard;
