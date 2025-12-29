/**
 * FloatingPanel.tsx
 * 
 * Slide-out panel that OVERLAYS content (doesn't push it).
 * Use with FloatingWidget for expanded details.
 * 
 * DO NOT use fixed sidebars - they squeeze content.
 * 
 * @created December 2025
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
  position?: 'right' | 'left';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FloatingPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  width = 'md',
  position = 'right',
  className = '',
}: FloatingPanelProps) {
  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const widthClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[480px]',
  };
  
  const positionClasses = {
    right: 'right-0 animate-in slide-in-from-right',
    left: 'left-0 animate-in slide-in-from-left',
  };
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 bottom-0 ${widthClasses[width]} ${positionClasses[position]}
                   bg-white shadow-2xl z-50 flex flex-col duration-300 ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="p-2 bg-purple-100 rounded-lg">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}

export default FloatingPanel;
