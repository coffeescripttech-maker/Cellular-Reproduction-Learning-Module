'use client';

/**
 * Compact Footer Component
 * A minimal footer design that takes less vertical space
 */
export function FooterCompact() {
  const currentYear = new Date().getFullYear();
  
  const developers = [
    'Georgia Jane Tudio',
    'Pearl Gwayne Yanson ',
    'Micaella Marie Solano',
    'Rhomela Jane Velasco'
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          {/* Copyright */}
          <div className="text-center sm:text-left">
            <p>© {currentYear} Cellular Reproduction Learning Module</p>
          </div>

          {/* Developers */}
          <div className="text-center sm:text-right">
            <p className="text-gray-500">
              Developed by {developers.join(' • ')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
