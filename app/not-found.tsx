"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen  px-4">
      <h1 className="text-6xl font-bold mb-4 text-primary">Coming Soon</h1>
      <h2 className="text-2xl mb-6">This feature is under development.</h2>
      <Link
        href="/dashboard/vault/my-files"
        className="px-6 py-3 bg-card font-semibold rounded-lg hover:bg-card/90 transition"
      >
        Return Home
      </Link>
    </div>
  );
}
