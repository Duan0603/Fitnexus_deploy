// packages/frontend/src/pages/admin/UserPlans.jsx
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, endpoints } from '../../lib/api';

const PAGE_SIZE = 10;

export default function AdminUserPlans() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async (page = 1, search = searchTerm) => {
    try {
      setLoading(true);
      const offset = (page - 1) * PAGE_SIZE;
      const params = new URLSearchParams({
        limit: PAGE_SIZE,
        offset,
        has_plans: '1',
        ...(search && { search }),
      });

      const response = await api.get(`/api/admin/users?${params}`);
      if (response.data?.success) {
        setUsers(response.data.data.items || []);
        setTotalUsers(response.data.data.total || 0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm);
  };

  const handleViewUserPlans = (userId) => {
    navigate(`/admin/user-plans/${userId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý Plans</h1>
        <p className="mt-1 text-sm text-gray-600">
          Quản lý kế hoạch tập luyện của người dùng
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên plan..."
              className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-white border rounded-lg animate-pulse">
              <div className="w-48 h-4 bg-gray-200 rounded" />
              <div className="w-32 h-4 mt-2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white border rounded-lg">
          Không tìm thấy người dùng nào có plan
        </div>
      ) : (
        <div className="overflow-hidden bg-white border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Số plan
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Public
                </th>
                {/* Thao tác column removed per request */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr 
                  key={user.user_id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewUserPlans(user.user_id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.total_plans || 0} plans</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'TRAINER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.has_public_plans ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Private
                      </span>
                    )}
                  </td>
                  {/* action column removed */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalUsers > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white border rounded-lg sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalPlans / PAGE_SIZE), p + 1))}
              disabled={currentPage >= Math.ceil(totalUsers / PAGE_SIZE)}
              className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(currentPage * PAGE_SIZE, totalUsers)}
                </span>
                {' '}trong{' '}
                <span className="font-medium">{totalUsers}</span>
                {' '}kết quả
              </p>
            </div>
            <div>
              <nav className="inline-flex -space-x-px rounded-md shadow-sm isolate" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-900 hover:bg-gray-50'
                  } ring-1 ring-inset ring-gray-300`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalPlans / PAGE_SIZE), p + 1))}
                  disabled={currentPage === Math.ceil(totalPlans / PAGE_SIZE)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === Math.ceil(totalPlans / PAGE_SIZE)
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-900 hover:bg-gray-50'
                  } ring-1 ring-inset ring-gray-300`}
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}