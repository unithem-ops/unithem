export const metadata = {
  title: "e-Kesihatan & Wabak SAGA",
  description: "Pemantauan kesihatan dan pengesanan awal kelompok penyakit",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
