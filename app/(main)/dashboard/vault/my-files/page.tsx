"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Search } from "lucide-react";

// Components
import UploadArea from "@/components/vault/UploadArea";
import FileList from "@/components/vault/FileList";
import InsightsPanel from "@/components/vault/InsightsPanel";

// Define type to include Merkle root
interface UploadedFile {
  file: File;
  rootHash: string;
}

export default function MyFilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleUpload = (uploadedFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header + Search */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Files</h1>
        <div className="flex items-center space-x-2">
          <Input placeholder="Search your vault..." className="w-72" />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <UploadArea />

      <div className="g">
        {/* File List */}
        <Card className="col-span-2">
        
          <CardContent>
            <FileList />
          </CardContent>
        </Card>

       
      </div>
    </div>
  );
}
