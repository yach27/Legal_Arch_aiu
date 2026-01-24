import React from "react";
import StaffLayout from "../../../../Layouts/StaffLayout";
import DocumentManagement from "./components/MainDoc/DocumentManagement";

export default function StaffDocuments() {
    return <DocumentManagement />;
}

StaffDocuments.layout = (page: React.ReactNode) => <StaffLayout hideSidebar={true} noPadding={true}>{page}</StaffLayout>;
