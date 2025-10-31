"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminPaths, publicPaths } from "@/lib/paths";
import { toast } from "sonner";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push(adminPaths.signIn);
      router.refresh();
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="text-4xl">🔒</div>
          </div>
          <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
          <CardDescription className="text-center">
            You don&apos;t have admin access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <p className="text-sm">
              Your account has been created successfully, but you don&apos;t have admin
              privileges yet.
            </p>
            <p className="text-sm">
              Please contact a system administrator to grant you admin access.
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleSignOut} className="w-full">
              Sign Out
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(publicPaths.home)}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
