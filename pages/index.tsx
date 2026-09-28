import { useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const query = new URLSearchParams(context.query as Record<string, string>).toString();
  return {
    redirect: {
      destination: `/app${query ? `?${query}` : ""}`,
      permanent: false,
    },
  };
};

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      router.replace(`/app${search}`);
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
