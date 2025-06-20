/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Increase from default 1MB to 10MB
    },
  },
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/classes",
        permanent: true, // or false for temporary redirect
      },
    ];
  },
};

export default config;
