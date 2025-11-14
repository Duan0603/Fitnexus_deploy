// packages/backend/controllers/support.controller.js
import User from "../models/user.model.js";
import BugReport from "../models/bugReport.model.js";
import { uploadBuffer } from "../utils/cloudinary.js";
import { sendMail } from "../utils/mailer.js";
import { buildBugReportEmail, buildBugReportResponseEmail } from "../utils/emailTemplates.js";
import { Op } from "sequelize";
import { notifyAdmins, notifyUser } from "../services/notification.service.js";

const BUG_S3_FOLDER = "fitnexus/bug-reports";
const BUG_SEVERITIES = ["low", "medium", "high", "critical"];
const BUG_STATUSES = ["open", "in_progress", "resolved", "closed"];
const BRAND_NAME = process.env.BRAND_NAME || "Fitnexus";

export async function submitBugReport(req, res) {
  try {
    const {
      title = "",
      description = "",
      steps = "",
      severity = "medium",
      contactEmail = "",
    } =
      req.body ?? {};

    if (!description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng mô tả lỗi bạn gặp phải.",
      });
    }

    const userId = req.userId || req.user?.user_id || null;
    const reporter = userId ? await User.findByPk(userId) : null;

    const normalizedSeverity = BUG_SEVERITIES.includes(String(severity).toLowerCase())
      ? String(severity).toLowerCase()
      : "medium";
    const normalizedTitle = title.trim() || "Báo lỗi người dùng";
    const normalizedDescription = description.trim();
    const normalizedSteps = steps.trim();
    const normalizedContact = (contactEmail || reporter?.email || "").trim() || null;

    let screenshotUrl = null;
    if (req.file?.buffer?.length) {
      try {
        const uploadResult = await uploadBuffer(req.file.buffer, {
          folder: BUG_S3_FOLDER,
          resource_type: "image",
        });
        screenshotUrl = uploadResult?.secure_url || null;
      } catch (uploadErr) {
        console.error("BugReport screenshot upload failed:", uploadErr?.message || uploadErr);
      }
    }

    const reporterPayload = reporter
      ? {
          id: reporter.user_id,
          email: reporter.email,
          username: reporter.username,
          fullName: reporter.fullName,
          plan: reporter.plan,
        }
      : null;

    let savedReport = null;
    try {
      savedReport = await BugReport.create({
        user_id: reporter?.user_id || null,
        contact_email: normalizedContact,
        title: normalizedTitle,
        description: normalizedDescription,
        steps: normalizedSteps,
        severity: normalizedSeverity,
        screenshot_url: screenshotUrl,
      });
    } catch (dbErr) {
      console.error("BugReport.save error:", dbErr?.message || dbErr);
    }

    const reportPayload = {
      title: normalizedTitle,
      description: normalizedDescription,
      steps: normalizedSteps,
      severity: normalizedSeverity,
      screenshotUrl,
      reporter: reporterPayload,
      contactEmail: normalizedContact,
    };

    const supportEmail =
      process.env.SUPPORT_EMAIL ||
      process.env.ADMIN_ALERT_EMAIL ||
      process.env.SMTP_USER;

    if (supportEmail) {
      const { subject, html, text } = buildBugReportEmail({ ...reportPayload, brand: BRAND_NAME });

      await sendMail({
        to: supportEmail,
        subject,
        html,
        text,
      });
    }

    if (savedReport) {
      await notifyAdmins({
        type: "support_report",
        title: `Báo lỗi mới: ${normalizedTitle}`,
        body: normalizedDescription?.slice(0, 200) || "Người dùng vừa gửi báo lỗi mới",
        metadata: { reportId: savedReport.report_id, url: "/admin/support" },
      });
    }

    return res.json({
      success: true,
      message: "Cảm ơn bạn! Báo lỗi đã được gửi tới đội ngũ hỗ trợ.",
      data: {
        reportId: savedReport?.report_id || null,
        screenshotUrl,
      },
    });
  } catch (err) {
    console.error("submitBugReport error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể gửi báo lỗi. Vui lòng thử lại sau.",
    });
  }
}

export async function listBugReports(req, res) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const status = String(req.query.status || "").toLowerCase();
    const severity = String(req.query.severity || "").toLowerCase();
    const search = (req.query.search || "").trim();

    const where = {};
    if (BUG_STATUSES.includes(status)) where.status = status;
    if (BUG_SEVERITIES.includes(severity)) where.severity = severity;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { steps: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await BugReport.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
      include: [
        { model: User, as: "reporter", attributes: ["user_id", "email", "username", "fullName", "plan"] },
        { model: User, as: "responder", attributes: ["user_id", "email", "username", "fullName", "plan"] },
      ],
    });

    return res.json({
      success: true,
      data: {
        items: rows,
        total: count,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error("listBugReports error:", err);
    return res.status(500).json({ success: false, message: "Không thể tải danh sách báo lỗi" });
  }
}

export async function getBugReportDetail(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const report = await BugReport.findByPk(id, {
      include: [
        { model: User, as: "reporter", attributes: ["user_id", "email", "username", "fullName", "plan"] },
        { model: User, as: "responder", attributes: ["user_id", "email", "username", "fullName", "plan"] },
      ],
    });

    if (!report) {
      return res.status(404).json({ success: false, message: "Không tìm thấy báo lỗi" });
    }

    return res.json({ success: true, data: report });
  } catch (err) {
    console.error("getBugReportDetail error:", err);
    return res.status(500).json({ success: false, message: "Không thể tải báo lỗi" });
  }
}

export async function respondBugReport(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const { status, responseMessage = "" } = req.body ?? {};
    if (!status && !responseMessage.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập phản hồi hoặc thay đổi trạng thái" });
    }

    const normalizedStatus = status ? String(status).toLowerCase() : null;
    if (normalizedStatus && !BUG_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const report = await BugReport.findByPk(id, {
      include: [{ model: User, as: "reporter" }, { model: User, as: "responder" }],
    });
    if (!report) {
      return res.status(404).json({ success: false, message: "Không tìm thấy báo lỗi" });
    }

    const responder = await User.findByPk(req.userId);

    if (normalizedStatus) {
      report.status = normalizedStatus;
    }

    if (responseMessage.trim()) {
      report.admin_response = responseMessage.trim();
      report.responded_by = responder?.user_id || req.userId || null;
      report.responded_at = new Date();
    }

    await report.save();
    await report.reload({
      include: [
        { model: User, as: "reporter", attributes: ["user_id", "email", "username", "fullName", "plan"] },
        { model: User, as: "responder", attributes: ["user_id", "email", "username", "fullName", "plan"] },
      ],
    });

    if (responseMessage.trim() && report.contact_email) {
      try {
        const responderName = responder?.fullName || responder?.username || "Đội ngũ Fitnexus";
        const { subject, html, text } = buildBugReportResponseEmail({
          brand: BRAND_NAME,
          responderName,
          message: responseMessage.trim(),
          report: report.get({ plain: true }),
        });
        await sendMail({ to: report.contact_email, subject, html, text });
      } catch (mailErr) {
        console.error("respondBugReport sendMail error:", mailErr);
      }
    }

    if (report.user_id) {
      await notifyUser(report.user_id, {
        type: "support_reply",
        title: "Admin đã phản hồi báo lỗi của bạn",
        body: responseMessage.trim() || "Báo lỗi của bạn đã được cập nhật",
        metadata: { reportId: report.report_id, url: `/support?reportId=${report.report_id}` },
      });
    }

    return res.json({ success: true, data: report });
  } catch (err) {
    console.error("respondBugReport error:", err);
    return res.status(500).json({ success: false, message: "Không thể cập nhật báo lỗi" });
  }
}
