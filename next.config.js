/** @type {import("next").NextConfig} */
const config = {
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/classes",
        permanent: true, // or false for temporary redirect
        experimental: {
          serverActions: {
            bodySizeLimit: "10mb", // Increase from default 1MB to 10MB
          },
        },
      },
    ];
  },
};

export default config;
