/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com'
    ],
  },
};

module.exports = nextConfig;
