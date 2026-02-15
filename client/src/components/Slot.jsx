import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { twMerge } from 'tailwind-merge';

export function Slot({ id, children, onClick }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={twMerge(
                "slot",
                "w-full h-16 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400 transition-colors",
                isOver ? "bg-green-100 border-green-500" : ""
            )}
            style={{
                height: '64px', // Force height to prevent collapse
                backgroundColor: isOver ? '#e6f4ea' : (children ? 'transparent' : '#f0f0f0'),
                border: children ? 'none' : '2px dashed #ccc',
                boxSizing: 'border-box'
            }}
        >
            {children}
        </div>
    );
}

export default Slot;
