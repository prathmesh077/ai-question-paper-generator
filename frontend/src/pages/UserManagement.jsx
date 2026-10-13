import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, UserPlus, CheckCircle2, 
  AlertTriangle, RefreshCw, Key, ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.updateUserRole(userId, newRole);
      setSuccessMsg(`User role updated to ${newRole}`);
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-slate-900">User Access Control & RBAC Management</h1>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Admin Only
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage system users and configure strict role-based access control (RBAC) across Paper Setters, Moderators, and Administrators.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Definitions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
            <Shield className="w-4 h-4" />
            <span>Administrator</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Full root control: Manage faculty accounts, configure LLM endpoints, review system audit trail logs.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
            <Users className="w-4 h-4" />
            <span>Paper Setter (Faculty)</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Authoring privileges: Upload course syllabus, create blueprints, run AI generation, and curate question banks.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Exam Moderator</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Quality assurance: Evaluate question diversity, inspect cognitive levels, approve or reject generated papers.
          </p>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Registered System Personnel ({users.length})</span>
          <button onClick={loadUsers} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Faculty / User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Assigned Role (RBAC)</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5">
                    <div className="font-semibold text-slate-900">{u.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{u.email}</td>
                  <td className="px-6 py-3.5 text-slate-600">{u.department}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                      u.role === 'administrator' ? 'bg-indigo-100 text-indigo-800' :
                      u.role === 'moderator' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs px-2.5 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="administrator">Administrator</option>
                      <option value="paper_setter">Paper Setter (Faculty)</option>
                      <option value="moderator">Exam Moderator</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
