import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Certificate, CertificateStatus } from '../../types';
import {
  Award,
  Upload,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const CertificatesView: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [status, setStatus] = useState<CertificateStatus>('student_confirmed');

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const data = await api.getCertificates();
      setCertificates(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Auto-fill from file name
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setName(cleanName);
    setIssuer('Coursera / University');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setSkillsInput('Algorithms, Data Structures');
    setStatus('extracted');
    setIsUploading(false);
    setIsModalOpen(true);
  };

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !issuer.trim()) return;

    const relatedSkills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const newCert = await api.addCertificate({
        name: name.trim(),
        issuer: issuer.trim(),
        issueDate,
        credentialId,
        credentialUrl,
        relatedSkills,
        verificationStatus: status,
      });

      setCertificates([newCert, ...certificates]);
      setIsModalOpen(false);

      // Reset
      setName('');
      setIssuer('');
      setCredentialId('');
      setCredentialUrl('');
      setSkillsInput('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: CertificateStatus) => {
    try {
      const updated = await api.updateCertificateStatus(id, newStatus);
      setCertificates(certificates.map(c => c.id === id ? updated : c));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCertificate(id);
      setCertificates(certificates.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (certStatus: CertificateStatus) => {
    switch (certStatus) {
      case 'issuer_verified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Issuer Verified
          </span>
        );
      case 'student_confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            Student Confirmed
          </span>
        );
      case 'extracted':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Extracted (Needs Review)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Verified Certificate Vault
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store, verify, and link course credentials to proven evidence in your portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Upload Certificate</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Grid of Certificates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-1.5">
                  {getStatusBadge(cert.verificationStatus)}
                  <button
                    onClick={() => handleDelete(cert.id)}
                    className="text-slate-300 hover:text-red-500 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-3 line-clamp-2">{cert.name}</h3>
              <p className="text-xs font-semibold text-blue-700 mt-0.5">{cert.issuer}</p>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {cert.issueDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Issued: {cert.issueDate}</span>
                  </div>
                )}
                {cert.credentialId && (
                  <div className="font-mono text-[11px] text-slate-400 truncate">
                    ID: {cert.credentialId}
                  </div>
                )}
              </div>

              {/* Related Skills Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {cert.relatedSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {cert.verificationStatus === 'extracted' ? (
                <button
                  onClick={() => handleUpdateStatus(cert.id, 'student_confirmed')}
                  className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-semibold transition-colors"
                >
                  Confirm Extracted Details
                </button>
              ) : cert.credentialUrl ? (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <span>Verify Credential URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">Evidence Stored</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Certificate</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter certificate credentials to back up your student skills matrix.
            </p>

            <form onSubmit={handleSaveCertificate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meta Front-End Developer Professional Certificate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stanford / Coursera"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credential ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CERT-98214"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="student_confirmed">Student Confirmed</option>
                    <option value="issuer_verified">Issuer Verified (Digital URL)</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Credential Link (URL)</label>
                <input
                  type="url"
                  placeholder="https://coursera.org/verify/..."
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Related Skills</label>
                <input
                  type="text"
                  placeholder="e.g. React, JavaScript, UI Design"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
