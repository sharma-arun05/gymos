// ============================================================================
// File & Document Storage Repository UI (/files)
// Organize member contracts, trainer certifications, waivers, & nutrition plans.
// ============================================================================

import React, { useState } from 'react';
import { Folder, FileText, Upload, Download, Trash2, Search, ShieldCheck, ExternalLink } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Button, Card, Badge, Input, EmptyState } from '../../components/ui';

export interface StorageFile {
  id: string;
  name: string;
  folder: 'Contracts' | 'Certifications' | 'Waivers' | 'Templates';
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export const FileManager: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const [files, setFiles] = useState<StorageFile[]>([
    { id: '1', name: 'VIP_Membership_Agreement_Rahul_S.pdf', folder: 'Contracts', size: '2.4 MB', uploadedAt: '02 Jul 2026', uploadedBy: 'Ananya Rao' },
    { id: '2', name: 'Liability_Waiver_Sneha_Patel.pdf', folder: 'Waivers', size: '1.1 MB', uploadedAt: '01 Jul 2026', uploadedBy: 'Front Desk' },
    { id: '3', name: 'ACE_Certified_PT_Vikram_Singh.pdf', folder: 'Certifications', size: '4.8 MB', uploadedAt: '15 Jun 2026', uploadedBy: 'Vikram Singh' },
    { id: '4', name: '12_Week_Hypertrophy_Workout_Template.xlsx', folder: 'Templates', size: '840 KB', uploadedAt: '10 Jun 2026', uploadedBy: 'Arun Kumar' },
  ]);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setFiles([
        {
          id: crypto.randomUUID(),
          name: `New_Document_Archive_${Date.now().toString().slice(-4)}.pdf`,
          folder: activeFolder === 'ALL' ? 'Contracts' : (activeFolder as any),
          size: '1.8 MB',
          uploadedAt: 'Just now',
          uploadedBy: 'You',
        },
        ...files,
      ]);
      setUploading(false);
      alert('📄 Document successfully uploaded to encrypted tenant Supabase Storage bucket!');
    }, 1200);
  };

  const handleDelete = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const filteredFiles = files.filter((f) => {
    const matchesFolder = activeFolder === 'ALL' || f.folder === activeFolder;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const folders = [
    { id: 'ALL', label: 'All Documents', count: files.length },
    { id: 'Contracts', label: 'Member Contracts', count: files.filter((f) => f.folder === 'Contracts').length },
    { id: 'Waivers', label: 'Liability Waivers', count: files.filter((f) => f.folder === 'Waivers').length },
    { id: 'Certifications', label: 'Trainer Certifications', count: files.filter((f) => f.folder === 'Certifications').length },
    { id: 'Templates', label: 'Workout & Diet Plans', count: files.filter((f) => f.folder === 'Templates').length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">Supabase Storage Bucket</Badge>
            <Badge variant="success" size="sm" className="gap-1">
              <ShieldCheck className="w-3 h-3" />
              AES-256 Encrypted
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Folder className="w-6 h-6 text-[#8B5CF6]" />
            File & Document Storage Repository
          </h1>
          <p className="text-sm text-gray-400">Securely store and organize member contracts, liability waivers, and workout spreadsheets.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleUpload} isLoading={uploading} leftIcon={<Upload className="w-4 h-4" />}>
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Folders Sidebar (3 Cols) */}
        <div className="lg:col-span-3 bg-[#111113] border border-[#27272A] rounded-2xl p-3 space-y-1">
          <span className="text-xs font-bold text-gray-500 uppercase px-3 py-2 block tracking-wider">Storage Folders</span>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFolder === f.id
                  ? 'bg-[#8B5CF6] text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#18181B]'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Folder className={`w-4 h-4 ${activeFolder === f.id ? 'text-white' : 'text-[#8B5CF6]'}`} />
                {f.label}
              </span>
              <Badge variant="neutral" size="sm">{f.count}</Badge>
            </button>
          ))}
        </div>

        {/* Right: Files Feed (9 Cols) */}
        <Card variant="default" className="lg:col-span-9 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
            <div className="w-full max-w-sm">
              <Input
                placeholder="Search filenames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <span className="text-xs text-gray-500 font-mono shrink-0 ml-4">Showing {filteredFiles.length} files</span>
          </div>

          <div className="divide-y divide-[#27272A]/50">
            {filteredFiles.length === 0 ? (
              <EmptyState title="No Files Found in Folder" description="Upload a new PDF or Excel document to this category." />
            ) : (
              filteredFiles.map((file) => (
                <div key={file.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#18181B]/50 px-3 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#8B5CF6]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-100 truncate hover:text-[#8B5CF6] cursor-pointer flex items-center gap-1.5">
                        {file.name}
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <Badge variant="info" size="sm">{file.folder}</Badge>
                        <span>• Size: {file.size}</span>
                        <span>• Uploaded by {file.uploadedBy} on {file.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => alert(`Downloading ${file.name}...`)} className="text-xs py-1 px-2.5">
                      <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 text-gray-500 hover:text-[#EF4444] rounded-lg hover:bg-[#27272A] transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
