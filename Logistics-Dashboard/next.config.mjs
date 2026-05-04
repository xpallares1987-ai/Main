/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['@torre/shared'],
  typescript: {
    // Optionally ignore build errors if we want to proceed, but better to fix them
    // ignoreBuildErrors: true, 
  }
};

export default nextConfig;
