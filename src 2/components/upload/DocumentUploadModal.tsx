import React from 'react';

export interface UploadedDocument {
  name: string;
  size: number;
  aiSuggestions: string[];
  extractedData: {
    projectName?: string;
    customerName?: string;
    location?: string;
    powerRequirement?: string;
    voltage?: string;
  };
}

interface DocumentUploadModalProps {
  onClose: () => void;
  onUpload: (documents: UploadedDocument[]) => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ onClose, onUpload }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const uploadedDocs: UploadedDocument[] = files.map(file => ({
        name: file.name,
        size: file.size,
        aiSuggestions: ['AI suggestion 1', 'AI suggestion 2'],
        extractedData: {
          projectName: 'Project X',
          customerName: 'Customer Y',
        },
      }));
      onUpload(uploadedDocs);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl mb-4">Upload Documents</h2>
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded">
          Close
        </button>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
