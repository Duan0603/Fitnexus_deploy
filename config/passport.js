import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

function toSafeUsername(displayName) {
  // chuyển về chữ thường, thay khoảng trắng và ký tự lạ
  return displayName
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24) || "user";
}

async function genUniqueUsername(base) {
  let name = base;
  let n = 0;
  // giả sử User có cột unique 'username'
  while (await User.findOne({ where: { username: name } })) {
    n += 1;
    name = `${base}_${n}`;
    if (name.length > 30) name = `${base}_${Math.random().toString(36).slice(2, 6)}`;
  }
  return name;
}

passport.use(
  new GoogleStrategy(
    {
clientID: process.env.GOOGLE_CLIENT_ID,
clientSecret: process.env.GOOGLE_CLIENT_SECRET,
callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const provider = "google";
        const providerId = String(profile.id);
        const email = profile.emails?.[0]?.value || null;
        const fullName = profile.displayName || "";
        const avatarUrl = profile.photos?.[0]?.value || null;

        // 1) Link theo email nếu đã có
        let user = null;
        if (email) {
          user = await User.findOne({ where: { email } });
          if (user) {
            if (!user.provider || !user.providerId) {
              await user.update({ provider, providerId });
            }
            return done(null, user);
          }
        }

        // 2) Tìm theo provider+providerId
        user = await User.findOne({ where: { provider, providerId } });
        if (user) return done(null, user);

        // 3) Tạo mới
        const baseUsername = toSafeUsername(fullName || email || "user");
        const username = await genUniqueUsername(baseUsername);

        user = await User.create({
          username,
          fullName,
          email,
          avatarUrl,
          provider,
          providerId,
        });

        if (req?.session) req.session.justCreated = true;
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Lưu ý: dùng đúng tên khóa chính của model bạn. Bạn nói PK là 'user_id'.
passport.serializeUser((user, done) => {
  // Nếu dùng Sequelize instance, đảm bảo lấy đúng trường PK
  done(null, user.user_id); // hoặc user.id nếu PK là 'id'
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    // có thể trả về plain object cho gọn
    done(null, user ? user.get({ plain: true }) : null);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
