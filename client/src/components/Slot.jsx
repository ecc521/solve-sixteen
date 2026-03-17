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
                "w-full h-16 rounded-lg flex items-center justify-center transition-colors box-border",
                children ? "border-none" : "border-2 border-dashed border-[#ccc]",
                isOver ? "bg-[#e6f4ea]" : (children ? "bg-transparent" : "bg-[#f0f0f0]")
            )}
        >
            {children}
        </div>
    );
}

export default Slot;
