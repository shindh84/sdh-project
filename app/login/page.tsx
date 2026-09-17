import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { TriangleAlertIcon } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>Google 계정으로 시작합니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>로그인에 실패했습니다</AlertTitle>
              <AlertDescription>다시 시도해주세요.</AlertDescription>
            </Alert>
          )}
          <GoogleLoginButton next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
