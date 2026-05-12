import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // permite acessar via IP da rede local em dev
  allowedDevOrigins: ["192.168.1.14", "localhost", "postou.vercel.app"],
};

export default nextConfig;
