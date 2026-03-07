'use client';

import { Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const developers = [
    'Georgia Jane Tudio',
    'Gwen Yanson',
    'Micaella Marie Solano',
    'Rhomela Jane Velasco'
  ];

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © {currentYear} Cellular Reproduction Learning Module. All rights reserved.
            </p>
          </div>

          {/* Developers */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
              Developed with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {developers.map((name, index) => (
                <span key={name} className="text-xs text-gray-600 font-medium">
                  {name}
                  {index < developers.length - 1 && (
                    <span className="text-gray-400 ml-3">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              VARK Learning Module System
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
