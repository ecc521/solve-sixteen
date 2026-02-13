import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Slot({ id, children, isOver, onClick }) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={twMerge(
                "slot",
                "w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400 transition-colors",
                isOver ? "bg-green-100 border-green-500" : ""
            )}
            style={{
                minHeight: '80px',
                backgroundColor: isOver ? '#e6f4ea' : (children ? 'transparent' : '#f0f0f0'),
                border: children ? 'none' : '2px dashed #ccc'
            }}
        >
            {children}
        </div>
    );
}

export default Slot;
