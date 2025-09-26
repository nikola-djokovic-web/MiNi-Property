import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { documents } from "@/lib/data";
import { FileText, FileType, PlusCircle } from "lucide-react";
import PageHeader from "@/components/page-header";

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
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documents"
        description="Securely store and manage your important files."
      >
        <Button>
          <PlusCircle className="mr-2 h-4" />
          Upload Document
        </Button>
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
                <TableHead className="text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                  <TableCell className="text-right">{doc.size}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
