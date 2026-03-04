// Environment configuration
export const config = {
  supabase: {
    url:
    
      'https://skhgelcmvbwkgzzkbawu.supabase.co',
    anonKey:
    
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGdlbGNtdmJ3a2d6emtiYXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjYyNjksImV4cCI6MjA4Mzg0MjI2OX0.K9W3-JtBqbagdzs-mcZXU96cUl4I013WrIevnUi_nmo',
    serviceRoleKey:
   
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraGdlbGNtdmJ3a2d6emtiYXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI2NjI2OSwiZXhwIjoyMDgzODQyMjY5fQ.O-uAundDUNHcn48_NPJt68dx-DEM_Rhj6xwfmbxBi-I'
  }
};

// Validate required environment variables
export function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars);
    console.warn('Please check your .env.local file');
  }

  return missingVars.length === 0;
}
