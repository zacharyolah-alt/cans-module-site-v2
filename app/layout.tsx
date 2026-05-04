export const metadata = {
  title: "C.A.N.S. Module Directory",
  description: "Columbus Area N Scalers module directory",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
