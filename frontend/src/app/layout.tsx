import { DotGothic16 } from 'next/font/google';
import './globals.css';

// フォントの設定（subset と weight を指定）
const dotGothic16 = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      {/* className にフォントクラスを指定 */}
      <body className={dotGothic16.className}>{children}</body>
    </html>
  );
}