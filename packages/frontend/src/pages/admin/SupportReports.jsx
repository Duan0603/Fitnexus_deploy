import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminListBugReportsApi,
  adminGetBugReportApi,
  adminRespondBugReportApi,
} from "../../lib/api.js";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
} from "lucide-react";

const STATUS_META = {
  open: { label: "Chờ xử lý", className: "bg-amber-100 text-amber-800" },
  in_progress: { label: "Đang xử lý", className: "bg-sky-100 text-sky-800" },
  resolved: { label: "Đã phản hồi", className: "bg-emerald-100 text-emerald-800" },
  closed: { label: "Đã đóng", className: "bg-slate-200 text-slate-700" },
};

const SEVERITY_META = {
  low: { label: "Thấp", className: "bg-emerald-100 text-emerald-800" },
  medium: { label: "Trung bình", className: "bg-amber-100 text-amber-800" },
  high: { label: "Cao", className: "bg-rose-100 text-rose-800" },
  critical: { label: "Nghiêm trọng", className: "bg-red-200 text-red-900" },
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    return value;
  }
};

const initialResponse = { status: "open", message: "" };

export default function SupportReports() {
  const [filters, setFilters] = useState({ status: "all", severity: "all", search: "" });
  const [pagination, setPagination] = useState({ limit: 10, offset: 0 });
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [responseForm, setResponseForm] = useState(initialResponse);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
      };
      if (filters.status !== "all") params.status = filters.status;
      if (filters.severity !== "all") params.severity = filters.severity;
      if (filters.search.trim()) params.search = filters.search.trim();
      const res = await adminListBugReportsApi(params);
      const data = res?.data || {};
      setReports(Array.isArray(data.items) ? data.items : []);
      setTotal(Number.isFinite(data.total) ? data.total : 0);
      if (data.items?.length) {
        setSelectedId((prev) => prev || data.items[0].report_id);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Không thể tải danh sách báo lỗi";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  const loadDetail = useCallback(async (reportId, fallback) => {
    setDetailLoading(true);
    setFeedback(null);
    try {
      if (fallback) setSelectedReport(fallback);
      const res = await adminGetBugReportApi(reportId);
      const data = res?.data || null;
      setSelectedReport(data);
      setResponseForm({
        status: data?.status || "open",
        message: data?.admin_response || "",
      });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Không thể tải báo lỗi";
      setFeedback({ type: "error", message });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (selectedId) {
      const fallback = reports.find((r) => r.report_id === selectedId);
      loadDetail(selectedId, fallback);
    } else {
      setSelectedReport(null);
      setResponseForm(initialResponse);
    }
  }, [selectedId, reports, loadDetail]);

  const totalPages = useMemo(() => {
    if (!pagination.limit) return 1;
    return Math.max(1, Math.ceil(total / pagination.limit));
  }, [pagination.limit, total]);

  const currentPage = useMemo(() => {
    if (!pagination.limit) return 1;
    return Math.floor(pagination.offset / pagination.limit) + 1;
  }, [pagination.offset, pagination.limit]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handleRespond = async () => {
    if (!selectedReport) return;
    if (!responseForm.status && !responseForm.message.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      await adminRespondBugReportApi(selectedReport.report_id, {
        status: responseForm.status,
        responseMessage: responseForm.message,
      });
      await loadReports();
      await loadDetail(selectedReport.report_id);
      setFeedback({ type: "success", message: "Đã lưu phản hồi và gửi email cho người dùng" });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Không thể cập nhật báo lỗi";
      setFeedback({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const renderBadge = (map, key) => {
    const meta = map[key];
    if (!meta) return <span className="text-xs text-gray-400">Không xác định</span>;
    return (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meta.className}`}>
        {meta.label}
      </span>
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <section className="p-5 bg-white border rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Support Desk</p>
            <h2 className="text-2xl font-semibold text-gray-900">Báo lỗi người dùng</h2>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={loadReports}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> Làm mới
            </button>
          </div>
        </div>

        {feedback?.type === "error" && (
          <div className="p-3 mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
            {feedback.message}
          </div>
        )}

        <div className="grid gap-3 mb-4 md:grid-cols-3">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-gray-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Chờ xử lý</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="resolved">Đã phản hồi</option>
            <option value="closed">Đã đóng</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange("severity", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-gray-200"
          >
            <option value="all">Mọi mức độ</option>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="critical">Nghiêm trọng</option>
          </select>
          <div className="relative">
            <Search className="absolute w-4 h-4 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề hoặc mô tả"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring focus:ring-gray-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 uppercase border-b">
                <th className="px-3 py-2">Tiêu đề</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Mức độ</th>
                <th className="px-3 py-2">Người gửi</th>
                <th className="px-3 py-2">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Chưa có báo lỗi nào phù hợp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const active = report.report_id === selectedId;
                  return (
                    <tr
                      key={report.report_id}
                      className={`border-b cursor-pointer ${
                        active ? "bg-indigo-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedId(report.report_id)}
                    >
                      <td className="px-3 py-3">
                        <p className="font-semibold text-gray-900 line-clamp-2">{report.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {report.description || "(Không có mô tả)"}
                        </p>
                      </td>
                      <td className="px-3 py-3">{renderBadge(STATUS_META, report.status)}</td>
                      <td className="px-3 py-3">{renderBadge(SEVERITY_META, report.severity)}</td>
                      <td className="px-3 py-3">
                        {report.reporter?.fullName || report.reporter?.email || "Ẩn danh"}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        {formatDate(report.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between mt-4 text-sm text-gray-600">
          <p>
            Hiển thị {reports.length} / {total} báo lỗi
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 border rounded-md disabled:opacity-40"
              onClick={() =>
                setPagination((prev) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))
              }
              disabled={currentPage <= 1}
            >
              Trước
            </button>
            <span>
              Trang {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              className="px-3 py-1 border rounded-md disabled:opacity-40"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  offset: Math.min(prev.offset + prev.limit, (totalPages - 1) * prev.limit),
                }))
              }
              disabled={currentPage >= totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      <section className="p-5 bg-white border rounded-2xl shadow-sm">
        {!selectedReport ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageCircle className="w-10 h-10 mb-2" />
            <p>Chọn một báo lỗi ở bảng bên trái để xem chi tiết và phản hồi.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-500">#{selectedReport.report_id}</p>
              <h3 className="text-xl font-semibold text-gray-900">{selectedReport.title}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {renderBadge(SEVERITY_META, selectedReport.severity)}
                {renderBadge(STATUS_META, selectedReport.status)}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Người gửi:</span> {" "}
                {selectedReport.reporter?.fullName || selectedReport.reporter?.email || "Ẩn danh"}
              </p>
              <p>
                <span className="font-medium">Liên hệ:</span> {" "}
                {selectedReport.contact_email ? (
                  <a href={`mailto:${selectedReport.contact_email}`} className="text-blue-600">
                    {selectedReport.contact_email}
                  </a>
                ) : (
                  "Không cung cấp"
                )}
              </p>
              <p>
                <span className="font-medium">Gửi lúc:</span> {formatDate(selectedReport.created_at)}
              </p>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <FileText className="w-4 h-4" /> Mô tả lỗi
              </p>
              <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">
                {selectedReport.description || "(Không có mô tả)"}
              </p>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Các bước tái hiện
              </p>
              <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">
                {selectedReport.steps || "(Không cung cấp)"}
              </p>
            </div>

            {selectedReport.screenshot_url && (
              <a
                href={selectedReport.screenshot_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
              >
                <Mail className="w-4 h-4" /> Xem ảnh đính kèm
              </a>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                value={responseForm.status}
                onChange={(e) => setResponseForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-gray-200"
              >
                <option value="open">Chờ xử lý</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="resolved">Đã phản hồi</option>
                <option value="closed">Đã đóng</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phản hồi gửi cho người dùng</label>
              <textarea
                rows={5}
                value={responseForm.message}
                onChange={(e) => setResponseForm((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-gray-200"
                placeholder="Nhập nội dung phản hồi..."
              />
            </div>

            {detailLoading && (
              <div className="text-xs text-gray-500">Đang tải chi tiết...</div>
            )}

            {feedback?.type === "success" && (
              <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">
                {feedback.message}
              </div>
            )}

            <button
              type="button"
              onClick={handleRespond}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Lưu phản hồi
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
