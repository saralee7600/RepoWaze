import { Network, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GoogleSignInButton } from './GoogleSignInButton';

interface LoginCardProps {
  /** Where to land after signing in. */
  callbackUrl: string;
  errorMessage?: string | null;
  /** Renders the button inert (used as the loading fallback). */
  disabled?: boolean;
}

export function LoginCard({ callbackUrl, errorMessage = null, disabled = false }: LoginCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <Network className="size-5" aria-hidden="true" />
        </span>
        <CardTitle className="text-lg">Sign in to AST Inspector</CardTitle>
        <CardDescription>
          Explore the entities and relations parsed from your repositories.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage !== null && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <GoogleSignInButton callbackUrl={callbackUrl} disabled={disabled} />
      </CardContent>

      <CardFooter className="justify-center text-center text-xs text-muted-foreground">
        We only use your Google account to identify you.
      </CardFooter>
    </Card>
  );
}
