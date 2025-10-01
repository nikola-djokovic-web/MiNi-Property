

'use client';

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { documents as initialDocuments } from "@/lib/data";
import { FileText, FileType, Trash2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import AddDocumentDialog from "@/components/documents/add-document-dialog";
import DeleteDocumentDialog from "@/components/documents/delete-document-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

function getFileIcon(type: string) {
  if (type.toLowerCase().includes("pdf")) {
    return <FileText className="size-5 text-destructive" />;
  }
  if (type.toLowerCase().includes("doc")) {
    return <FileText className="size-5 text-primary" />;
  }
  return <FileType className="size-5 text-muted-foreground" />;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(initialDocuments);

  const handleAddDocument = (newDoc: Omit<typeof initialDocuments[0], 'id' | 'uploadDate'> & { file: File }) => {
    const newDocument = {
        id: `doc-${documents.length + 1}`,
        name: newDoc.file.name,
        type: newDoc.type,
        uploadDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        size: `${(newDoc.file.size / 1024 / 1024).toFixed(2)} MB`,
    };
    setDocuments(prevDocs => [...prevDocs, newDocument]);
  }

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prevDocs => prevDocs.filter(d => d.id !== docId));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documents"
        description="Securely store and manage your important files."
      >
        <AddDocumentDialog onAddDocument={handleAddDocument} />
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">
                  Upload Date
                </TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TooltipProvider>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.name)}
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {doc.type}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.uploadDate}
                    </TableCell>
                    <TableCell>{doc.size}</TableCell>
                    <TableCell className="text-right">
                        <DeleteDocumentDialog document={doc} onDelete={() => handleDeleteDocument(doc.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TooltipProvider>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
