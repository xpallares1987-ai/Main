/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/shared'],
  typescript: {
    // Optionally ignore build errors if we want to proceed, but better to fix them
    // ignoreBuildErrors: true, 
  }
};

export default nextConfig;
