import './globals.scss';

export const metadata = {
  title: 'SRKR x ToriiMinds | Gateway to Tech Excellence',
  description: 'ToriiMinds and SRKR Engineering College collaboration programs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
