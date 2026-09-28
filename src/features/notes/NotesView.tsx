import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Note, DocumentItem } from '../../types';
import {
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Tag,
  Upload,
  BookOpen,
  FileCheck,
  Brain,
  RotateCcw,
  Check,
  Search
} from 'lucide-react';

export const NotesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notes' | 'documents'>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Note Editor State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiActionResult, setAiActionResult] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Document Upload State
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notesData, docsData] = await Promise.all([
        api.getNotes(),
        api.getDocuments(),
      ]);
      setNotes(notesData);
      setDocuments(docsData);
      if (notesData.length > 0 && !selectedNoteId) {
        selectNote(notesData[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setSubject(note.subject || '');
    setContent(note.content);
    setTagsInput(note.tags.join(', '));
    setAiActionResult(null);
  };

  const handleCreateNewNote = async () => {
    try {
      const newNote = await api.createNote({
        title: 'Untitled Lecture Note',
        subject: 'General Study',
        content: '# Concept Overview\n\nWrite your private study notes here...',
        tags: ['study'],
        isPinned: false,
      });
      setNotes([newNote, ...notes]);
      selectNote(newNote);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNoteId) return;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const updated = await api.updateNote(selectedNoteId, {
        title,
        subject,
        content,
        tags,
      });
      setNotes(notes.map(n => n.id === selectedNoteId ? updated : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await api.deleteNote(id);
      const next = notes.filter(n => n.id !== id);
      setNotes(next);
      if (selectedNoteId === id) {
        if (next.length > 0) selectNote(next[0]);
        else {
          setSelectedNoteId(null);
          setTitle('');
          setContent('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Actions on current note
  const handleAIAction = async (action: 'summarize' | 'flashcards' | 'explain') => {
    if (!content.trim()) return;
    setIsAiProcessing(true);
    try {
      const { result } = await api.processNoteAI(action, content);
      setAiActionResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Document Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const res = await api.uploadFile(file.name, file.type || 'text/plain', base64, 'documents');

        // Add document entry
        const newDoc = await api.addDocument({
          title: file.name,
          category: 'lecture_note',
          fileUrl: res.storagePath,
          mimeType: file.type || 'text/plain',
          fileSize: res.fileSize,
          summaryText: `Document uploaded: ${file.name}. Private sandboxed file ready for AI analysis.`,
          tags: ['uploaded', file.type.includes('pdf') ? 'pdf' : 'doc'],
        });

        setDocuments([newDoc, ...documents]);
      } catch (err: any) {
        console.error(err);
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Notes & Study Documents
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your private repository for academic notes, lecture slides, and AI-powered summaries.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'notes' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Study Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'documents' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Files & PDFs ({documents.length})
          </button>
        </div>
      </div>

      {activeTab === 'notes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)] min-h-[500px]">
          {/* Notes Sidebar List */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col h-full shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <button
                onClick={handleCreateNewNote}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                title="New Note"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-2 space-y-1.5">
              {filteredNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="truncate">{note.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="text-slate-400 hover:text-red-500 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {note.subject && (
                      <span className="text-[10px] text-blue-700 font-medium">{note.subject}</span>
                    )}
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-mono">
                      {note.content.replace(/#+/g, '').slice(0, 80)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note Editor Area */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full shadow-2xs">
            {selectedNoteId ? (
              <div className="flex-1 flex flex-col h-full space-y-3">
                {/* Note Metadata Bar */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note Title"
                      className="text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none py-1"
                    />
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Course / Subject"
                      className="text-xs text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none py-1"
                    />
                  </div>

                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                  >
                    Save Changes
                  </button>
                </div>

                {/* AI Actions Toolbar */}
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    AI Note Tools:
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAIAction('summarize')}
                      disabled={isAiProcessing}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      Summarize
                    </button>
                    <button
                      onClick={() => handleAIAction('flashcards')}
                      disabled={isAiProcessing}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      Flashcards
                    </button>
                    <button
                      onClick={() => handleAIAction('explain')}
                      disabled={isAiProcessing}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      Explain Simply
                    </button>
                  </div>
                </div>

                {/* AI Result Box if available */}
                {aiActionResult && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between font-semibold text-blue-900">
                      <span>AI Insights</span>
                      <button
                        onClick={() => setAiActionResult(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ×
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700">{aiActionResult}</pre>
                  </div>
                )}

                {/* Textarea Content */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start typing your study note here (markdown supported)..."
                  className="flex-1 w-full p-3 text-xs font-mono bg-slate-50/40 border border-slate-200 rounded-lg focus:outline-none focus:bg-white resize-none"
                />

                {/* Tags bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Tags separated by commas (e.g. algorithms, trees, finals)"
                    className="flex-1 text-xs text-slate-600 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Select or create a study note to view and edit.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DOCUMENTS TAB */
        <div className="space-y-4">
          {/* Upload Area */}
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Upload Study Document / Lecture PDF</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Files are stored privately in your isolated sandbox storage (`private_storage`).
            </p>
            <div className="mt-4">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                <span>{uploadLoading ? 'Uploading File...' : 'Select PDF or Document'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Document list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-3 truncate">{doc.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{doc.summaryText}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
