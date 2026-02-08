import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // If user hasn't completed onboarding and trying to access dashboard
    if (!token?.onboardingCompleted && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // If user has completed onboarding and trying to access onboarding
    if (token?.onboardingCompleted && pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/accounts/:path*", "/expenses/:path*", "/income/:path*", "/savings/:path*", "/credit-cards/:path*", "/emi/:path*", "/borrow/:path*", "/reports/:path*", "/planning/:path*", "/settings/:path*"],
};
