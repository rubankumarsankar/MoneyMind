/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure ESM packages are properly transpiled
  transpilePackages: ['sweetalert2'],
  
  // Disable ESLint during build (optional, speeds up builds)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Experimental settings for better build compatibility
  experimental: {
    // Enable server components by default
    serverComponentsExternalPackages: ['nodemailer'],
  },
};

export default nextConfig;
