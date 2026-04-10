/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'standalone' for Vercel - Vercel handles this automatically
  // output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: '**.vercel.app' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Suppress optional MongoDB peer dependency warnings (kerberos, snappy, etc.)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      // These are optional MongoDB deps not needed for Atlas connections
      config.externals.push(
        'kerberos',
        'snappy',
        '@mongodb-js/zstd',
        '@aws-sdk/credential-providers',
        'gcp-metadata',
        'socks',
        'aws4',
        'mongodb-client-encryption'
      )
    }

    // Suppress NextAuth Edge Runtime warnings (known issue with NextAuth v4)
    // These warnings don't affect functionality - NextAuth JWT works correctly
    config.ignoreWarnings = [
      { module: /node_modules\/next-auth/ },
      { module: /node_modules\/jose/ },
    ]

    return config
  },
}

export default nextConfig
