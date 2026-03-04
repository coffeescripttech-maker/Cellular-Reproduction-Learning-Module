'use client';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Page Not Found</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
          padding: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '6rem', fontWeight: 'bold', color: '#e5e7eb', margin: 0 }}>404</h1>
            <h2 style={{ marginTop: '1rem', fontSize: '1.875rem', fontWeight: '600', color: '#1f2937' }}>
              Page Not Found
            </h2>
            <p style={{ marginTop: '0.5rem', color: '#4b5563' }}>
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <a 
                href="/"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Go Back Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
