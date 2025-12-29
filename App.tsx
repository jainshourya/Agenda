
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AgendaView } from './components/AgendaView';
import { ChatInterface } from './components/ChatInterface';
import { FileData, MeetingAgenda } from './types';
import { generateAgenda } from './services/geminiService';

declare var mammoth: any;

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    const processFileContent = async (content: string, type: string, isText: boolean) => {
      const newFile: FileData = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: type,
        content: content,
        processed: false
      };

      try {
        const agenda = await generateAgenda(newFile.content, newFile.name, newFile.type, isText);
        newFile.agenda = agenda;
        newFile.processed = true;
        
        setFiles(prev => [newFile, ...prev]);
        setActiveFileId(newFile.id);
      } catch (error: any) {
        console.error("DETAILED_ERROR:", error);
        alert(`Failed to process file: ${error.message || 'Unknown error'}. Check the browser console for details.`);
      } finally {
        setIsProcessing(false);
      }
    };

    // Robust file type detection
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith('.docx');
    const isTextFile = file.type.includes('text') || file.type.includes('json') || file.type.includes('markdown') || file.name.endsWith('.txt') || file.name.endsWith('.md');

    if (isDocx) {
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          await processFileContent(result.value, 'text/plain', true);
        } catch (err) {
          console.error("Mammoth extraction error:", err);
          setIsProcessing(false);
          alert("Could not extract text from Word document.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (isTextFile) {
      reader.onload = async (e) => {
        await processFileContent(e.target?.result as string, file.type || 'text/plain', true);
      };
      reader.readAsText(file);
    } else {
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1] || result;
        await processFileContent(base64, file.type || 'application/octet-stream', false);
      };
      reader.readAsDataURL(file);
    }
  };

  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar 
        files={files} 
        activeFileId={activeFileId} 
        onSelectFile={setActiveFileId} 
        onUpload={handleFileUpload}
        isProcessing={isProcessing}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeFile ? (
          <AgendaView agenda={activeFile.agenda!} fileName={activeFile.name} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">No Document Selected</h2>
              <p className="text-slate-500 max-w-sm mt-2">
                Upload a project brief, proposal, Word doc, or PDF to automatically generate a detailed meeting agenda.
              </p>
            </div>
          </div>
        )}
      </main>

      <ChatInterface activeAgenda={activeFile?.agenda} />
    </div>
  );
};

export default App;
