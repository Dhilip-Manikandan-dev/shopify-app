import { useEffect } from "react";
import { useRouter } from "next/router";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const q = router.asPath.includes("?")
        ? router.asPath.substring(router.asPath.indexOf("?"))
        : "";
      router.replace(`/app${q}`);
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
        <p className="text-sm text-gray-500">Redirecting to Smart Offer Rules...</p>
      </div>
    </div>
  );
}
