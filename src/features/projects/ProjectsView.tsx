import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Project } from '../../types';
import {
  FolderGit2,
  Plus,
  ExternalLink,
  Github,
  Trash2,
  Layers,
  Calendar,
  Star,
  Sparkles,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred'>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('Solo Developer');
  const [techStackInput, setTechStackInput] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const techStack = techStackInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const newProj = await api.addProject({
        title: title.trim(),
        description: description.trim(),
        role: role.trim(),
        techStack,
        githubUrl: githubUrl.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined,
        isStarred,
        startDate: new Date().toISOString().split('T')[0],
      });

      setProjects([newProj, ...projects]);
      setIsModalOpen(false);

      // Reset
      setTitle('');
      setDescription('');
      setTechStackInput('');
      setGithubUrl('');
      setLiveUrl('');
      setIsStarred(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStar = async (id: string) => {
    try {
      const updated = await api.toggleStarProject(id);
      setProjects(projects.map(p => p.id === id ? updated : p));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const starredCount = projects.filter(p => p.isStarred).length;
  const filteredProjects = activeFilter === 'starred'
    ? projects.filter(p => p.isStarred)
    : projects;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-600" />
            Engineering & Academic Projects
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Document your repositories, architectural choices, and hands-on deliverables.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Filter Tabs with Stars feature */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveFilter('starred')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeFilter === 'starred'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${activeFilter === 'starred' ? 'fill-white' : 'text-amber-500 fill-amber-400'}`} />
          <span>Starred Projects ({starredCount})</span>
        </button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {activeFilter === 'starred' ? 'No starred projects yet' : 'No projects listed'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilter === 'starred'
              ? 'Click the star icon on any project card to feature it prominently on your CV and portfolio.'
              : 'Add your first technical project to build evidence for your portfolio.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className={`bg-white border rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-all ${
                proj.isStarred
                  ? 'border-amber-300 ring-1 ring-amber-200/60 bg-gradient-to-b from-amber-50/20 to-white'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">
                        {proj.role || 'Developer'}
                      </span>
                      {proj.isStarred && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300/80 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                          Featured ⭐
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{proj.title}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Star Toggle Button */}
                    <button
                      onClick={() => handleToggleStar(proj.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        proj.isStarred
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50/50'
                      }`}
                      title={proj.isStarred ? 'Unstar project' : 'Star as featured project'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          proj.isStarred
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-400 hover:text-amber-500'
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {proj.description}
                </p>

                {/* Tech Stack Pills */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {(proj.techStack || proj.technologies || []).map((tech: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium"
                    >
                      <Github className="w-4 h-4" />
                      <span>Source Code</span>
                    </a>
                  )}
                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {proj.isStarred ? '⭐ Star Artifact' : 'Verified Artifact'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Portfolio Project</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add technical accomplishments to your portfolio.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Key-Value Store"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the architectural design, challenges solved, and results achieved..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Engineer / Backend Dev"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tech Stack</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, Docker, Redis, gRPC"
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub / Code URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Live URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStarred}
                    onChange={(e) => setIsStarred(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                      Star this Project as Featured
                    </span>
                    <p className="text-[11px] text-amber-700/90 mt-0.5">
                      Featured starred projects receive top placement on your CV and interactive portfolio.
                    </p>
                  </div>
                </label>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
