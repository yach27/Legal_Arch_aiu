// AdminDocument.tsx - Main page component for admin document management with TypeScript
import React from 'react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import DocumentManagement from './components/MainDoc/DocumentManagement';

type NextPageWithLayout = React.FC & {
  layout?: (page: React.ReactElement) => React.ReactNode;
};

const AdminDocument: NextPageWithLayout = () => {
  return (
    <DocumentManagement />
  );
};

// Apply Admin Layout wrapper with TypeScript
AdminDocument.layout = (page: React.ReactElement) => (
  <AdminLayout hideSidebar={true} noPadding={true}>{page}</AdminLayout>
);

export default AdminDocument;