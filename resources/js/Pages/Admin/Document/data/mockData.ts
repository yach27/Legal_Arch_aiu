// mockData.ts - Sample data with TypeScript types
import { MockData } from '../types/types';

export const mockData: MockData = {
  folders: [
    {
      folder_id: 1,
      folder_name: "Admin",
      folder_path: "/admin",
      parent_folder_id: null,
      created_by: 1,
      folder_type: "system",
      created_at: "2024-01-15T08:00:00Z",
      updated_at: "2024-01-15T08:00:00Z",
      subfolders: [
        {
          folder_id: 2,
          folder_name: "AI Assistant",
          folder_path: "/admin/ai-assistant",
          parent_folder_id: 1,
          created_by: 1,
          folder_type: "regular",
          created_at: "2024-01-15T08:30:00Z",
          updated_at: "2024-01-15T08:30:00Z"
        },
        {
          folder_id: 3,
          folder_name: "Dashboard",
          folder_path: "/admin/dashboard",
          parent_folder_id: 1,
          created_by: 1,
          folder_type: "regular",
          created_at: "2024-01-15T09:00:00Z",
          updated_at: "2024-01-15T09:00:00Z"
        }
      ]
    },
    {
      folder_id: 4,
      folder_name: "Document",
      folder_path: "/document",
      parent_folder_id: null,
      created_by: 1,
      folder_type: "regular",
      created_at: "2024-01-16T10:00:00Z",
      updated_at: "2024-01-16T10:00:00Z",
      subfolders: []
    },
    {
      folder_id: 5,
      folder_name: "Reports",
      folder_path: "/reports",
      parent_folder_id: null,
      created_by: 1,
      folder_type: "regular",
      created_at: "2024-01-20T10:00:00Z",
      updated_at: "2024-01-20T10:00:00Z",
      subfolders: []
    },
    {
      folder_id: 6,
      folder_name: "Templates",
      folder_path: "/templates",
      parent_folder_id: null,
      created_by: 1,
      folder_type: "regular",
      created_at: "2024-01-21T10:00:00Z",
      updated_at: "2024-01-21T10:00:00Z",
      subfolders: []
    }
  ],
  documents: [
    {
      doc_id: 1,
      title: "index.tsx",
      file_path: "/document/index.tsx",
      created_by: "admin",
      status: "active",
      category_id: 1,
      folder_id: 4,
      remarks: "Main index file",
      created_at: "2024-01-16T10:30:00Z",
      updated_at: "2024-01-16T10:30:00Z"
    },
    {
      doc_id: 2,
      title: "User Manual.pdf",
      file_path: "/admin/dashboard/user-manual.pdf",
      created_by: "admin",
      status: "active",
      category_id: 2,
      folder_id: 3,
      remarks: "User documentation",
      created_at: "2024-01-17T11:00:00Z",
      updated_at: "2024-01-17T11:00:00Z"
    },
    {
      doc_id: 3,
      title: "API Documentation.docx",
      file_path: "/admin/ai-assistant/api-docs.docx",
      created_by: "developer",
      status: "draft",
      category_id: 1,
      folder_id: 2,
      remarks: "API reference guide",
      created_at: "2024-01-18T14:00:00Z",
      updated_at: "2024-01-18T14:00:00Z"
    },
    {
      doc_id: 4,
      title: "Monthly Report.xlsx",
      file_path: "/reports/monthly-report.xlsx",
      created_by: "analyst",
      status: "active",
      category_id: 3,
      folder_id: 5,
      remarks: "January 2024 monthly report",
      created_at: "2024-02-01T09:00:00Z",
      updated_at: "2024-02-01T09:00:00Z"
    },
    {
      doc_id: 5,
      title: "Contract Template.docx",
      file_path: "/templates/contract-template.docx",
      created_by: "legal",
      status: "active",
      category_id: 4,
      folder_id: 6,
      remarks: "Standard contract template",
      created_at: "2024-01-25T15:00:00Z",
      updated_at: "2024-01-25T15:00:00Z"
    }
  ],
  categories: [
    {
      category_id: 1,
      category_name: "Technical",
      description: "Technical documentation and guides"
    },
    {
      category_id: 2,
      category_name: "User Guide",
      description: "User manuals and tutorials"
    },
    {
      category_id: 3,
      category_name: "Reports",
      description: "Business reports and analytics"
    },
    {
      category_id: 4,
      category_name: "Legal",
      description: "Legal documents and contracts"
    }
  ],
  users: [
    {
      user_id: 1,
      firstname: "John",
      lastname: "Admin",
      middle_name: "M",
      email: "admin@company.com",
      password: "hashed_password"
    }
  ]
};