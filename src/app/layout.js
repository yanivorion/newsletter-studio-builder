import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Newsletter Studio',
  description: 'Professional newsletter platform with visual editor and bulk email sending',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
