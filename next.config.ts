import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "@react-pdf/renderer", "nodemailer"],
};

export default nextConfig;
