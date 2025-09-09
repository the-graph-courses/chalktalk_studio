import { MoreHorizontal, Trash2, Copy } from 'lucide-react';
import React from 'react';

interface SlideContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
}

export default function SlideContextMenu({ x, y, onClose, onDuplicate, onDelete }: SlideContextMenuProps) {
    const menuRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (menuRef.current && target && menuRef.current.contains(target)) {
                // Click inside the menu: do not close
                return;
            }
            onClose();
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed bg-background border border-border rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
            style={{ top: y, left: x, transform: 'translateY(calc(-100% - 4px))' }}
        >
            <ul className="py-1">
                <li>
                    <button
                        onClick={onDuplicate}
                        className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-accent text-foreground"
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                    </button>
                </li>
                <li>
                    <button
                        onClick={onDelete}
                        className="flex items-center w-full px-4 py-2 text-sm text-left text-destructive hover:bg-accent"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </button>
                </li>
            </ul>
        </div>
    );
}
