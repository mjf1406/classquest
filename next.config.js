/** @type {import("next").NextConfig} */
const config = {
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
