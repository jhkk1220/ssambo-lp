import "./globals.css";

export const metadata = {
  title: "쌈보보쌈",
  description: "동네에서 제일 든든한 보쌈 한상, 쌈보보쌈",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
