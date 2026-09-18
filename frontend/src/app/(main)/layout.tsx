import React from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="main-layout-wrapper">
      {/* ここに各 page.tsx (zoo や topic-setting) が流し込まれます */}
      {children}
    </div>
  );
}