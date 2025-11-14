import axios from "axios";
import SubscriptionPlan from "../models/subscription.plan.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import dns from "dns";
import { Op } from "sequelize";
import payos, { payosEnabled } from "../services/payos.client.js";
import { sendMail } from "../utils/mailer.js";
import { buildPremiumUpgradedEmailVn2 as buildPremiumUpgradedEmail } from "../utils/emailTemplates.js";
import { notifyUser } from "../services/notification.service.js";
import { FRONTEND_URL, BACKEND_URL } from "../config/env.js";

dns.setDefaultResultOrder?.("ipv4first");

const DAY_MS = 24 * 60 * 60 * 1000;

// === Helper: tạo mã orderCode ngắn, an toàn ===
function uniqueOrderCode() {
  const sec = Math.floor(Date.now() / 1000);
  const rand = Math.floor(Math.random() * 1000);
  return sec * 1000 + rand;
}

async function sendPremiumUpgradeSuccess(userId, expiresAt) {
  if (!userId) return;
  try {
    await notifyUser(userId, {
      type: "premium_upgrade",
      title: "🎉 Tài khoản của bạn vừa được nâng lên Premium",
      body: expiresAt
        ? `Quyền lợi Premium sẽ kéo dài đến ${new Date(expiresAt).toLocaleDateString("vi-VN")}.`
        : "Bạn đã mở khoá toàn bộ quyền lợi Premium.",
      metadata: { expiresAt },
    });
  } catch {}
}

async function sendPremiumUpgradeFailed(userId, reason = "Thanh toán không thành công. Vui lòng thử lại.") {
  if (!userId) return;
  try {
    await notifyUser(userId, {
      type: "premium_payment_failed",
      title: "Thanh toán thất bại",
      body: reason,
    });
  } catch {}
}

// === Tạo link thanh toán PayOS ===
export async function createPaymentLink(req, res) {
  try {
    const userId = req.userId || req.user?.user_id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { planId } = req.body || {};
    if (!planId)
      return res
        .status(400)
        .json({ success: false, message: "Missing planId" });

    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || !plan.is_active)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    const orderCode = uniqueOrderCode();
    const tx = await Transaction.create({
      user_id: userId,
      plan_id: plan.plan_id,
      amount: plan.price,
      status: "pending",
      payos_order_code: orderCode,
    });

    const backendUrl = BACKEND_URL;
    const frontendUrl = FRONTEND_URL;
    const useBackendReturn = String(process.env.PAYOS_USE_BACKEND_RETURN ?? '1') !== '0';
    const returnUrl = useBackendReturn
      ? `${backendUrl}/api/payment/return`
      : `${frontendUrl}/payment/success?orderCode=${orderCode}`;
    const cancelUrl = useBackendReturn
      ? `${backendUrl}/api/payment/cancel`
      : `${frontendUrl}/payment/cancel`;

    // === Payload chuẩn PayOS (v2) ===
    const payload = {
      orderCode: Number(orderCode), // Phải là integer <= 15 chữ số
      amount: Math.round(Number(plan.price)), // integer, không được có thập phân
      description: `${plan.name}`,
      // Use FE routes by default to avoid public backend in dev
      returnUrl,
      cancelUrl,
      items: [
        {
          name: plan.name,
          quantity: 1,
          price: Math.round(Number(plan.price)),
        },
      ],
      buyerName: req.user?.name || "Khách hàng",
      buyerEmail: req.user?.email || "example@gmail.com",
    };

    // Prefer official SDK to ensure signature is correct
    let checkoutUrl, qrCode;
    if (payos && payosEnabled && payos.paymentRequests && typeof payos.paymentRequests.create === "function") {
      console.log("[PayOS] Using SDK to create payment link");
      const data = await payos.paymentRequests.create(payload);
      checkoutUrl = data?.checkoutUrl || data?.paymentLink || data?.checkout_url;
      qrCode = data?.qrCode || data?.qr_code || null;
    } else {
      // Fallback: direct API (requires correct headers and may be rejected without signature)
      console.warn("[PayOS] SDK unavailable; falling back to direct API call");
      const baseAPI = "https://api-merchant.payos.vn";
      console.log("Sending payload to PayOS:", JSON.stringify(payload, null, 2));
      console.log("Using headers:", {
        clientId: process.env.PAYOS_CLIENT_ID,
        apiKey: process.env.PAYOS_API_KEY?.slice(0, 6) + "...",
      });
      const resp = await axios.post(`${baseAPI}/v2/payment-requests`, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.PAYOS_CLIENT_ID?.trim(),
          "x-api-key": process.env.PAYOS_API_KEY?.trim(),
        },
        timeout: 10000,
      });
      console.log("PayOS response:", resp.data);
      if (resp.data.code !== "00") {
        throw new Error(
          `PayOS error ${resp.data.code}: ${resp.data.desc || "Unknown error"}`
        );
      }
      const data = resp.data.data || {};
      checkoutUrl = data.checkoutUrl;
      qrCode = data.qrCode;
    }

    if (!checkoutUrl) throw new Error("PAYOS response missing checkoutUrl field.");

    return res.json({
      success: true,
      data: {
        checkoutUrl,
        qrCode,
        orderCode,
        transaction_id: tx.transaction_id,
      },
    });
  } catch (err) {
    console.error("createPaymentLink error:", err);
    return res.status(500).json({
      success: false,
      message: "PAYOS_CREATE_FAILED",
      detail: String(err?.message || err),
    });
  }
}

// === Xử lý webhook thanh toán PayOS ===
export async function handlePayosWebhook(req, res) {
  try {
    // 1. Xác thực webhook từ PayOS (SDK v2)
    let webhookObj;
    if (Buffer.isBuffer(req.body)) {
      try {
        webhookObj = JSON.parse(req.body.toString("utf8"));
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid raw webhook body" });
      }
    } else {
      webhookObj = req.body || {};
    }
    const webhookData = await payos.webhooks.verify(webhookObj);
    const { orderCode, status, paymentId } = webhookData;

    // 2. Tìm giao dịch trong DB
    const tx = await Transaction.findOne({
      where: { payos_order_code: orderCode },
    });
    if (!tx || tx.status !== "pending") {
      return res
        .status(200)
        .json({ success: true, message: "Old or invalid transaction" });
    }

    // 3. Cập nhật trạng thái dựa vào webhook
    if (status === "PAID") {
      const plan = await SubscriptionPlan.findByPk(tx.plan_id);
      if (plan) {
        const newExpiryDate = new Date();
        newExpiryDate.setDate(
          newExpiryDate.getDate() + Number(plan.duration_days || 30)
        );
        await User.update(
          { plan: "PREMIUM", user_type: "premium", user_exp_date: newExpiryDate },
          { where: { user_id: tx.user_id } }
        );
        try {
          const upgradedUser = await User.findByPk(tx.user_id);
          if (upgradedUser?.email) {
            const frontend = FRONTEND_URL;
            const tpl = buildPremiumUpgradedEmail({
              name: upgradedUser.fullName || upgradedUser.username || "bạn",
              expiresAt: newExpiryDate,
              dashboardUrl: `${frontend}/dashboard`,
            });
            await sendMail({ to: upgradedUser.email, ...tpl });
          }
        } catch {}
        await tx.update({
          status: "completed",
          payos_payment_id: paymentId || null,
        });
        await sendPremiumUpgradeSuccess(tx.user_id, newExpiryDate);
      }
    } else if (["CANCELLED", "FAILED"].includes(status)) {
      await tx.update({ status: "failed" });
      await sendPremiumUpgradeFailed(tx.user_id);
    }

    // 4. Phản hồi cho PayOS
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(
      "handlePayosWebhook error (invalid signature or processing failed):",
      err.message
    );
    return res
      .status(400)
      .json({ success: false, message: "Invalid webhook or signature" });
  }
}

// === Redirect sau khi thanh toán ===
export async function returnUrl(req, res) {
  const frontendUrl = FRONTEND_URL;
  try {
    const orderCodeRaw = req.query?.orderCode;
    const orderCode = Number(orderCodeRaw);

    if (orderCode && !Number.isNaN(orderCode) && payos && payosEnabled && payos.paymentRequests?.get) {
      const link = await payos.paymentRequests.get(orderCode);
      const status = link?.status || "UNKNOWN";

      const tx = await Transaction.findOne({ where: { payos_order_code: String(orderCode) } });

      if (tx && status === "PAID" && tx.status !== "completed") {
        const plan = await SubscriptionPlan.findByPk(tx.plan_id);
        if (plan) {
          const newExpiryDate = new Date();
          newExpiryDate.setDate(newExpiryDate.getDate() + Number(plan.duration_days || 30));
          await User.update(
            { plan: "PREMIUM", user_type: "premium", user_exp_date: newExpiryDate },
            { where: { user_id: tx.user_id } }
          );
          await tx.update({ status: "completed" });
          await sendPremiumUpgradeSuccess(tx.user_id, newExpiryDate);
        }
      }
    }
    // Luôn redirect về trang chủ frontend
    return res.redirect(`${frontendUrl}/`);
  } catch (err) {
    console.error("returnUrl error:", err);
    // Chuyển hướng về trang chủ ngay cả khi có lỗi
    return res.redirect(`${frontendUrl}/`);
  }
}

export async function cancelUrl(req, res) {
  try {
    const frontend = FRONTEND_URL;
    return res.redirect(`${frontend}/dashboard`);

  } catch {
    return res.redirect("/");
  }
}

// === Verify (polling) thanh toán không cần webhook ===
export async function verifyPaymentStatus(req, res) {
  try {
    const userId = req.userId || req.user?.user_id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const orderCodeRaw = req.body?.orderCode ?? req.query?.orderCode;
    const orderCode = Number(orderCodeRaw);
    if (!orderCode || Number.isNaN(orderCode)) {
      return res.status(400).json({ success: false, message: "Missing or invalid orderCode" });
    }

    if (!(payos && payosEnabled && payos.paymentRequests?.get)) {
      return res.status(503).json({ success: false, message: "PayOS SDK unavailable" });
    }

    const link = await payos.paymentRequests.get(orderCode);
    const status = link?.status || "UNKNOWN";

    const tx = await Transaction.findOne({ where: { payos_order_code: String(orderCode) } });
    if (!tx) {
      return res.status(404).json({ success: false, message: "Transaction not found", status });
    }
    if (tx.user_id !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (status === "PAID" && tx.status !== "completed") {
      const plan = await SubscriptionPlan.findByPk(tx.plan_id);
      if (plan) {
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + Number(plan.duration_days || 30));
        await User.update(
          { plan: "PREMIUM", user_type: "premium", user_exp_date: newExpiryDate },
          { where: { user_id: tx.user_id } }
        );
        try {
          const upgradedUser = await User.findByPk(tx.user_id);
          if (upgradedUser?.email) {
            const frontend = FRONTEND_URL;
            const tpl = buildPremiumUpgradedEmail({
              name: upgradedUser.fullName || upgradedUser.username || "bạn",
              expiresAt: newExpiryDate,
              dashboardUrl: `${frontend}/dashboard`,
            });
            await sendMail({ to: upgradedUser.email, ...tpl });
          }
        } catch {}
      }
      await tx.update({ status: "completed" });
      await sendPremiumUpgradeSuccess(tx.user_id, newExpiryDate);
    } else if (["CANCELLED", "FAILED", "EXPIRED"].includes(status) && tx.status === "pending") {
      await tx.update({ status: "failed" });
      await sendPremiumUpgradeFailed(tx.user_id);
    }

    return res.json({ success: true, status, transaction: { id: tx.transaction_id, dbStatus: tx.status } });
  } catch (err) {
    console.error("verifyPaymentStatus error:", err);
    return res.status(500).json({ success: false, message: "VERIFY_FAILED", detail: String(err?.message || err) });
  }
}

// === Dev-only: Mock upgrade to PREMIUM (no real payment) ===
export async function mockUpgradePremium(req, res) {
  try {
    const allowMock = (process.env.NODE_ENV !== 'production') || String(process.env.ALLOW_PAYMENT_MOCK ?? '0') === '1';
    if (!allowMock) {
      return res.status(403).json({ success: false, message: 'Mock upgrade disabled in production' });
    }

    const userId = req.userId || req.user?.user_id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const durationDays = Number(process.env.MOCK_PREMIUM_DAYS || 30);
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + (Number.isFinite(durationDays) ? durationDays : 30));

    await User.update(
      { plan: 'PREMIUM', user_type: 'premium', user_exp_date: newExpiryDate },
      { where: { user_id: userId } }
    );

    const user = await User.findByPk(userId);
    try {
      if (user?.email) {
        const frontend = FRONTEND_URL;
        const tpl = buildPremiumUpgradedEmail({
          name: user.fullName || user.username || 'bạn',
          expiresAt: newExpiryDate,
          dashboardUrl: `${frontend}/dashboard`,
        });
        await sendMail({ to: user.email, ...tpl });
      }
    } catch {}
    await sendPremiumUpgradeSuccess(userId, newExpiryDate);
    return res.json({ success: true, message: 'Mock upgraded to PREMIUM', data: { user } });
  } catch (err) {
    console.error('mockUpgradePremium error:', err);
    return res.status(500).json({ success: false, message: 'MOCK_UPGRADE_FAILED', detail: String(err?.message || err) });
  }
}

export async function listMyPurchases(req, res) {
  try {
    const userId = req.userId || req.user?.user_id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findByPk(userId, {
      attributes: ['plan', 'user_type', 'user_exp_date'],
    });

    const transactions = await Transaction.findAll({
      where: { user_id: userId, status: { [Op.in]: ['completed', 'pending'] } },
      include: [
        {
          model: SubscriptionPlan,
          as: 'planTransaction',
          attributes: ['plan_id', 'name', 'slug', 'price', 'duration_days'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const activePlanId =
      user?.user_type === 'premium'
        ? transactions.find((tx) => tx.status === 'completed')?.plan_id || null
        : null;

    const purchases = transactions.map((tx) => {
      const plan = tx.planTransaction;
      const expiresAt =
        tx.status === 'completed' && plan?.duration_days
          ? new Date(tx.created_at.getTime() + plan.duration_days * DAY_MS)
          : null;
      const isActive = !!(activePlanId && plan && plan.plan_id === activePlanId && user?.user_type === 'premium');
      return {
        transactionId: tx.transaction_id,
        planId: plan?.plan_id || tx.plan_id,
        planName: plan?.name || null,
        planSlug: plan?.slug || null,
        price: plan?.price || tx.amount,
        durationDays: plan?.duration_days || null,
        status: tx.status,
        purchasedAt: tx.created_at,
        expiresAt,
        isActive,
        activeUntil: isActive ? user?.user_exp_date : null,
      };
    });

    return res.json({ success: true, data: { purchases, subscription: user } });
  } catch (err) {
    console.error('listMyPurchases error:', err);
    return res.status(500).json({ success: false, message: 'Không thể tải lịch sử nâng cấp' });
  }
}
