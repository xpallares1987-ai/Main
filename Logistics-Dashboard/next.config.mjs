/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Control-Tower/Logistics-Dashboard',
  assetPrefix: '/Control-Tower/Logistics-Dashboard/',
  trailingSlash: true,
  transpilePackages: ['@torre/shared'],
  typescript: {
    // Optionally ignore build errors if we want to proceed, but better to fix them
    // ignoreBuildErrors: true, 
  }
};

export default nextConfig;
