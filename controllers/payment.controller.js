import axios from "axios";
import SubscriptionPlan from "../models/subscription.plan.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import dns from "dns";
import payos, { payosEnabled } from "../services/payos.client.js";

dns.setDefaultResultOrder?.("ipv4first");

// === Helper: tạo mã orderCode ngắn, an toàn ===
function uniqueOrderCode() {
  const sec = Math.floor(Date.now() / 1000);
  const rand = Math.floor(Math.random() * 1000);
  return sec * 1000 + rand;
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

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
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
          { user_type: "premium", user_exp_date: newExpiryDate },
          { where: { user_id: tx.user_id } }
        );
        await tx.update({
          status: "completed",
          payos_payment_id: paymentId || null,
        });
      }
    } else if (["CANCELLED", "FAILED"].includes(status)) {
      await tx.update({ status: "failed" });
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
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
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
            { user_type: "premium", user_exp_date: newExpiryDate },
            { where: { user_id: tx.user_id } }
          );
          await tx.update({ status: "completed" });
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
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontend}/`);
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
          { user_type: "premium", user_exp_date: newExpiryDate },
          { where: { user_id: tx.user_id } }
        );
      }
      await tx.update({ status: "completed" });
    } else if (["CANCELLED", "FAILED", "EXPIRED"].includes(status) && tx.status === "pending") {
      await tx.update({ status: "failed" });
    }

    return res.json({ success: true, status, transaction: { id: tx.transaction_id, dbStatus: tx.status } });
  } catch (err) {
    console.error("verifyPaymentStatus error:", err);
    return res.status(500).json({ success: false, message: "VERIFY_FAILED", detail: String(err?.message || err) });
  }
}
