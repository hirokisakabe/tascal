/** @type {import('next').NextConfig} */
const nextConfig = {
	async redirects() {
		return [
			{
				source: "/",
				destination: "/list",
				permanent: true,
			},
		];
	},
};

export default nextConfig;
