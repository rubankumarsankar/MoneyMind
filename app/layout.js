import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

export const metadata = {
  title: "MoneyMind - Personal Finance Manager",
  description: "Algorithm-based personal finance management system.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
