/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure ESM packages are properly transpiled
  transpilePackages: ['sweetalert2'],
  
  // Moved from experimental.serverComponentsExternalPackages in Next.js 16+
  serverExternalPackages: ['nodemailer'],
};

export default nextConfig;
