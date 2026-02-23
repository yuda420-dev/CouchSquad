import Link from "next/link";
import { Users, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-ember/10 flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-ember" />
        </div>

        <h1 className="font-display text-4xl font-bold mb-3 text-foreground">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Looks like this page doesn&apos;t exist. Your coaches are waiting for you back home.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-ember hover:bg-ember/90 text-white shadow-lg shadow-ember/20">
            <Link href="/home">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border hover:border-ember/20">
            <Link href="/discover">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Coaches
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
