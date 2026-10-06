import './globals.css';

export const metadata = {
  title: 'POV Task Logger',
  description: 'Structured first-person activity logging demo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
