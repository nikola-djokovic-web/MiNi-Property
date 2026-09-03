'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatedTableRow } from "@/components/ui/animated-table-row";
import { AnimatePresence } from "framer-motion";
import { FileText, FileType, Trash2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import AddDocumentDialog from "@/components/documents/add-document-dialog";
import DeleteDocumentDialog from "@/components/documents/delete-document-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";

type DocumentItem = {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
  size: string;
};

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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { dict } = useTranslation();

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Failed to load documents');
      const { data } = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error(error);
      toast({ title: dict?.documents?.loadFailed || 'Failed to load documents', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleAddDocument = async (newDoc: { type: string; file: File }) => {
    try {
      const formData = new FormData();
      formData.append('file', newDoc.file);
      formData.append('type', newDoc.type);

      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed');
      }
      const { data } = await res.json();
      setDocuments((prev) => [data, ...prev]);
    } catch (error: any) {
      toast({ title: dict?.documents?.uploadFailed || 'Failed to upload document', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const previous = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (error) {
      setDocuments(previous);
      toast({ title: dict?.documents?.deleteFailed || 'Failed to delete document', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={dict?.documents?.title || "Documents"}
        description={dict?.documents?.description || "Securely store and manage your important files."}
      >
        <AddDocumentDialog onAddDocument={handleAddDocument} />
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict?.documents?.table?.name || "Name"}</TableHead>
                <TableHead className="hidden sm:table-cell">{dict?.documents?.table?.type || "Type"}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {dict?.documents?.table?.uploadDate || "Upload Date"}
                </TableHead>
                <TableHead>{dict?.documents?.table?.size || "Size"}</TableHead>
                <TableHead className="text-right">{dict?.documents?.table?.actions || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TooltipProvider>
                <AnimatePresence mode="popLayout">
                  {!loading && documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {dict?.documents?.noDocumentsYet || "No documents uploaded yet."}
                      </TableCell>
                    </TableRow>
                  )}
                  {documents.map((doc) => (
                    <AnimatedTableRow key={doc.id} layoutId={`document-${doc.id}`}>
                      <TableCell>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 hover:underline"
                        >
                          {getFileIcon(doc.name)}
                          <span className="font-medium">{doc.name}</span>
                        </a>
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
                    </AnimatedTableRow>
                  ))}
                </AnimatePresence>
              </TooltipProvider>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
