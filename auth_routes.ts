import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export function setupAuth(app: express.Express, db: any) {
  
  function renderLayout(title: string, content: string) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
              body { font-family: system-ui, -apple-system, sans-serif; background-color: #F8FAFC; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .login-container { background: white; padding: 40px; border-radius: 10px; border: 1px solid #E2E8F0; width: 100%; max-width: 400px; text-align: center; box-sizing: border-box; margin: auto; }
              .login-container.admin { background: #1A3A5C; color: white; border: none; }
              .logo-container { margin-bottom: 24px; }
              .logo-text { font-size: 24px; font-weight: 800; color: #1A3A5C; letter-spacing: 0.1em; margin-bottom: 4px; }
              .admin .logo-text { color: white; }
              .logo-sub { font-size: 11px; color: #F5C518; letter-spacing: 0.15em; font-weight: bold; }
              h1 { color: #1A3A5C; font-size: 22px; margin: 0 0 4px 0; font-weight: 700; }
              .admin h1 { color: white; }
              .sub-head { color: #94A3B8; font-size: 13px; margin: 0 0 24px 0; }
              .admin .sub-head { color: #F5C518; letter-spacing: 0.1em; }
              form { text-align: left; }
              label { display: block; font-size: 12px; color: #1A3A5C; font-weight: 600; margin-bottom: 6px; }
              .admin label { color: white; }
              input { width: 100%; padding: 10px 14px; margin-bottom: 16px; border: 1px solid #E2E8F0; border-radius: 6px; box-sizing: border-box; font-size: 14px; transition: border-color 0.2s; }
              input:focus { border: 2px solid #1A3A5C; outline: none; }
              input:disabled { background-color: #F1F5F9; color: #94A3B8; cursor: not-allowed; }
              .admin input { background: white; color: #1A3A5C; border: 1px solid white; }
              .admin input:focus { border: 2px solid #F5C518; }
              button { width: 100%; padding: 12px; background-color: #1A3A5C; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; cursor: pointer; transition: background-color 0.2s; margin-top: 8px;}
              button:hover { background-color: #F5C518; color: #1A3A5C; }
              .admin button { background-color: #F5C518; color: #1A3A5C; }
              .admin button:hover { background-color: white; color: #1A3A5C; }
              .field-error { color: #DC2626; font-size: 12px; margin-top: -12px; margin-bottom: 16px; display: block; }
              .banner-error { background: #FEF2F2; color: #DC2626; padding: 10px; border-radius: 6px; border: 1px solid #FECACA; font-size: 13px; margin-bottom: 20px; text-align: center; }
              .banner-success { background: #F0FDF4; color: #16A34A; padding: 10px; border-radius: 6px; border: 1px solid #BBF7D0; font-size: 13px; margin-bottom: 20px; text-align: center; }
              .admin .banner-error { background: rgba(220, 38, 38, 0.2); color: #FCA5A5; border-color: #FCA5A5; }
              .footer-link { margin-top: 24px; font-size: 13px; color: #475569; text-align: center; }
              .footer-link a { color: #1A3A5C; text-decoration: underline; }
              .admin .footer-link { color: rgba(255,255,255,0.7); }
              .admin .footer-link a { color: #F5C518; text-decoration: none; }
              .logo-svg { display: inline-block; width: 40px; height: 40px; margin-bottom: 8px; fill: #F5C518; }
          </style>
      </head>
      <body>
          ${content}
      </body>
      </html>
    `;
  }

  async function checkBruteForce(identifier: string, ip: string) {
    const time15 = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const res = await db.query(
      "SELECT COUNT(*) FROM login_attempts WHERE ip_address = $1 AND success = FALSE AND attempted_at > $2",
      [ip, time15]
    );
    const count = parseInt(res.rows[0].count, 10);
    return count >= 5;
  }

  async function logAttempt(identifier: string, ip: string, success: boolean) {
    await db.query(
      "INSERT INTO login_attempts (identifier, ip_address, success) VALUES ($1, $2, $3)",
      [identifier, ip, success]
    );
  }

    function renderRoleSelection() {
    return renderLayout('Welcome to DOLPHI', `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 40px 20px; box-sizing: border-box;">
        <svg style="width: 48px; height: 48px; fill: #1A3A5C; margin-bottom: 16px;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#F5C518" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19.93C8.44 19.43 5.41 15.34 6.13 10.8L8.14 12.81C7.6 14.81 8.87 16.85 10.99 17.48C13.25 18.15 15.54 16.63 15.86 14.28C16.14 12.18 14.49 10.25 12.39 10.02L10.3 7.93C15.22 8.42 18.42 12.91 17.37 17.65C16.66 20.85 13.9 19.93 13 19.93Z" />
        </svg>
        <h1 style="color: #1A3A5C; font-size: 24px; font-weight: bold; margin: 0 0 8px 0; text-align: center;">Welcome to DOLPHI</h1>
        <div style="color: #94A3B8; font-size: 14px; margin-bottom: 32px; text-align: center;">Please select how you would like to sign in</div>
        
        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 600px;">
          <a href="/login" style="flex: 1; min-width: 200px; background: white; border: 2px solid #E2E8F0; border-radius: 10px; padding: 32px 24px; cursor: pointer; text-align: center; text-decoration: none; transition: border-color 0.2s ease, background-color 0.2s ease; display: flex; flex-direction: column; align-items: center;" onmouseover="this.style.borderColor='#F5C518'; this.style.backgroundColor='#FFFBEB'" onmouseout="this.style.borderColor='#E2E8F0'; this.style.backgroundColor='white'">
            <div style="font-size: 40px; margin-bottom: 12px;">💬</div>
            <div style="color: #1A3A5C; font-size: 18px; font-weight: bold; margin-bottom: 8px;">Customer</div>
            <div style="color: #94A3B8; font-size: 13px; margin-top: 8px;">Access the DOLPHI customer service chatbot</div>
          </a>
          
          <a href="/admin/login" style="flex: 1; min-width: 200px; background: white; border: 2px solid #E2E8F0; border-radius: 10px; padding: 32px 24px; cursor: pointer; text-align: center; text-decoration: none; transition: border-color 0.2s ease, background-color 0.2s ease; display: flex; flex-direction: column; align-items: center;" onmouseover="this.style.borderColor='#F5C518'; this.style.backgroundColor='#FFFBEB'" onmouseout="this.style.borderColor='#E2E8F0'; this.style.backgroundColor='white'">
            <div style="font-size: 40px; margin-bottom: 12px;">🔧</div>
            <div style="color: #1A3A5C; font-size: 18px; font-weight: bold; margin-bottom: 8px;">Administrator</div>
            <div style="color: #94A3B8; font-size: 13px; margin-top: 8px;">Access the admin dashboard and management tools</div>
          </a>
        </div>
        
        <div style="width: 100%; max-width: 600px; height: 1px; background: #E2E8F0; margin: 32px 0;"></div>
        
        <div style="font-size: 14px; color: #475569; text-align: center;">
          New customer? <a href="/register" style="color: #1A3A5C; text-decoration: underline;">Create an account</a>
        </div>
      </div>
    `);
  }

  function renderRegister(formData: any = {}, errors: any = {}, globalError: string = '') {
    return renderLayout('Register - DOLPHI', `
      <div class="login-container">
          <div class="logo-container">
              <svg class="logo-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19.93C8.44 19.43 5.41 15.34 6.13 10.8L8.14 12.81C7.6 14.81 8.87 16.85 10.99 17.48C13.25 18.15 15.54 16.63 15.86 14.28C16.14 12.18 14.49 10.25 12.39 10.02L10.3 7.93C15.22 8.42 18.42 12.91 17.37 17.65C16.66 20.85 13.9 19.93 13 19.93Z" />
              </svg>
              <div class="logo-text">DOLPHI</div>
              <div class="logo-sub">HYBRID RAG SERVICE ENGINE</div>
          </div>
          <h1>Create Customer Account</h1>
          <div class="sub-head">Register to use DOLPHI customer service</div>
<div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 10px 14px; color: #1D4ED8; font-size: 12px; margin-bottom: 20px; text-align: center;">Note: This form is for customer accounts only. If you are an administrator, please contact your system administrator for access.</div>
          ${globalError ? '<div class="banner-error">' + globalError + '</div>' : ''}
          <form method="POST" action="/register">
              
              <label>Full Name</label>
              <input type="text" name="full_name" placeholder="Full name" value="${formData.full_name || ''}">
              ${errors.full_name ? '<span class="field-error">' + errors.full_name + '</span>' : ''}

              <label>Username</label>
              <input type="text" name="username" placeholder="Choose a username" value="${formData.username || ''}">
              ${errors.username ? '<span class="field-error">' + errors.username + '</span>' : ''}

              <label>Email Address</label>
              <input type="email" name="email" placeholder="Email address" value="${formData.email || ''}">
              ${errors.email ? '<span class="field-error">' + errors.email + '</span>' : ''}

              <label>Password</label>
              <input type="password" name="password" placeholder="Create a password">
              ${errors.password ? '<span class="field-error">' + errors.password + '</span>' : ''}

              <label>Confirm Password</label>
              <input type="password" name="confirm_password" placeholder="Confirm your password">
              ${errors.confirm_password ? '<span class="field-error">' + errors.confirm_password + '</span>' : ''}

              <div style="text-align: center; font-size: 11px; color: #94A3B8; letter-spacing: 0.1em;">Required Information</div>
              <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
              <button type="submit">REGISTER</button>
          </form>
          <div class="footer-link">
              Already have an account? <a href="/login">Sign in here</a>
          </div>
      </div>
    `);
  }

  function renderLogin(formData: any = {}, globalError: string = '', errors: any = {}, successBanner: string = '') {
    return renderLayout('Login - DOLPHI', `
      <div class="login-container">
          <div class="logo-container">
              <svg class="logo-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19.93C8.44 19.43 5.41 15.34 6.13 10.8L8.14 12.81C7.6 14.81 8.87 16.85 10.99 17.48C13.25 18.15 15.54 16.63 15.86 14.28C16.14 12.18 14.49 10.25 12.39 10.02L10.3 7.93C15.22 8.42 18.42 12.91 17.37 17.65C16.66 20.85 13.9 19.93 13 19.93Z" />
              </svg>
              <div class="logo-text">DOLPHI</div>
              <div class="logo-sub">HYBRID RAG SERVICE ENGINE</div>
          </div>
          <h1>Customer Login</h1>
          <div class="sub-head">Sign in to access DOLPHI support</div>
          ${globalError ? '<div class="banner-error">' + globalError + '</div>' : ''}
          ${successBanner ? '<div class="banner-success">' + successBanner + '</div>' : ''}
          <form method="POST" action="/login">
              <label>Username or Email</label>
              <input type="text" name="identifier" placeholder="Username or email address" value="${formData.identifier || ''}">
              ${errors.identifier ? '<span class="field-error">' + errors.identifier + '</span>' : ''}

              <label>Password</label>
              <input type="password" name="password" placeholder="Your password">
              ${errors.password ? '<span class="field-error">' + errors.password + '</span>' : ''}

              <button type="submit">SIGN IN</button>
          </form>
          <div style="margin-top: 10px; font-size: 12px; text-align: center;"><a href="/forgot-password" style="color: #94A3B8; text-decoration: none;">Forgot your password?</a></div>
          <div class="footer-link">
              Don't have an account? <a href="/register">Register here</a><br><br><span style="color: #94A3B8; font-size: 13px;">Administrator? </span><a href="/admin/login" style="color: #94A3B8; text-decoration: underline;">Go to Admin Login</a>
          </div>
      </div>
    `);
  }

  function renderAdminLogin(formData: any = {}, globalError: string = '', errors: any = {}) {
    return renderLayout('Admin Login - DOLPHI', `
      <div class="login-container admin">
          <div class="logo-container">
              <svg class="logo-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19.93C8.44 19.43 5.41 15.34 6.13 10.8L8.14 12.81C7.6 14.81 8.87 16.85 10.99 17.48C13.25 18.15 15.54 16.63 15.86 14.28C16.14 12.18 14.49 10.25 12.39 10.02L10.3 7.93C15.22 8.42 18.42 12.91 17.37 17.65C16.66 20.85 13.9 19.93 13 19.93Z" />
              </svg>
              <div class="logo-text">DOLPHI</div>
              <div class="logo-sub">ADMINISTRATION</div>
          </div>
          <h1>Administrator Login</h1>
          <div class="sub-head" style="color: #F5C518; font-size: 12px; letter-spacing: 0.1em;">Restricted access — authorized personnel only</div>
          ${globalError ? '<div class="banner-error">' + globalError + '</div>' : ''}
          <form method="POST" action="/admin/login">
              <label>Username</label>
              <input type="text" name="username" placeholder="Username" value="${formData.username || ''}">
              ${errors.username ? '<span class="field-error">' + errors.username + '</span>' : ''}

              <label>Password</label>
              <input type="password" name="password" placeholder="Password">
              ${errors.password ? '<span class="field-error">' + errors.password + '</span>' : ''}

              <button type="submit">SIGN IN</button>
          </form>
          <div class="footer-link">
              <span style="color: #475569;">Customer login</span> <a href="/login" style="color: #F5C518; text-decoration: underline;">Go to Customer Login</a>
          </div>
      </div>
    `);
  }

  app.get('/register', async (req, res) => {
    try {
      res.send(renderRegister());
    } catch(e) {
      console.error(e); res.status(500).send(e.message);
    }
  });

  app.post('/register', async (req, res) => {
    try {
        const body = req.body;
        if (body.role) {
          console.log(`SECURITY WARNING: Role field detected in public registration request from IP ${req.ip}. This field has been ignored.`);
          delete body.role;
        }
        
        const { full_name, username, email, password, confirm_password, access_code } = body;
        const errors: any = {};
        const formData = { full_name, username, email };
        
        let finalRole = 'user';
        let used_access_code = false;

        if (access_code) {
           const expectedCode = process.env.ADMIN_ACCESS_CODE || 'MISSING_CODE';
           const secrets = { compare_digest: (a, b) => {
                const aB = Buffer.from(a);
                const bB = Buffer.from(b);
                return aB.length === bB.length && crypto.timingSafeEqual(aB, bB);
           }};
           if (secrets.compare_digest(access_code, expectedCode)) {
               finalRole = 'admin';
               used_access_code = true;
           } else {
               console.warn(`SECURITY WARNING: Invalid access code attempt during registration from IP ${req.ip} with username ${username}`);
               errors.access_code = "Invalid access code. Please check your code and try again.";
           }
        }

        if (!full_name || full_name.length < 2 || full_name.length > 80) {
          errors.full_name = "Full name must be between 2 and 80 characters.";
        }
        const userRegex = /^[A-Za-z0-9_]+$/;
        if (!username || username.length < 3 || username.length > 80 || !userRegex.test(username)) {
          errors.username = "Username may only contain letters, numbers, and underscores.";
        } else {
          const uRes = await db.query('SELECT 1 FROM users WHERE username = $1', [username]);
          if (uRes.rows.length > 0) errors.username = "This username is already taken.";
        }

        if (!email) {
          errors.email = "Please enter a valid email address.";
        } else {
          const eRes = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
          if (eRes.rows.length > 0) errors.email = "This email is already registered.";
        }

        if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
          errors.password = "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
        }

        if (password !== confirm_password) {
          errors.confirm_password = "Passwords do not match.";
        }

        if (Object.keys(errors).length > 0) {
          return res.send(renderRegister(formData, errors, ''));
        }

        const pHash = await bcrypt.hash(password, 10);
        const iRes = await db.query(
          "INSERT INTO users (username, email, password_hash, role, used_access_code) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          [username, email, pHash, finalRole, used_access_code]
        );
        
        const newUserId = iRes.rows[0].id;
        
        const token = crypto.randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        await db.query(
          "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)",
          [newUserId, token, expiresAt]
        );

        res.cookie('dolphi_session', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'none', secure: true });
        return res.redirect('/login?registered=true');
    } catch (e: any) {
      console.error(e);
      res.send(renderRegister(req.body, {}, "An unexpected error occurred. Please try again."));
    }
  });



  app.get('/forgot-password', (req, res) => {
    res.send(renderLayout('Forgot Password', `
      <div class="login-container">
        <h1>Forgot Password</h1>
        <p>Enter your email and we will send you a reset link.</p>
        <form method="POST" action="/forgot-password">
           <input type="email" name="email" placeholder="Email address" required>
           <button type="submit">SEND RESET LINK</button>
        </form>
      </div>`)
    );
  });

  app.post('/forgot-password', async (req, res) => {
      const { email } = req.body;
      try {
          const uRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
          if (uRes.rows.length > 0) {
              const resetToken = crypto.randomBytes(32).toString('base64url');
              const exp = new Date(Date.now() + 60 * 60 * 1000).toISOString();
              await db.query('UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3', [resetToken, exp, uRes.rows[0].id]);
              const baseUrl = process.env.BASE_URL || ('http://' + req.get('host'));
              const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
              console.log("DEV MODE - RESET URL: " + resetUrl);
          }
      } catch(e) {}
      res.send(renderLayout('Check your email', '<div class="login-container"><p>If this email is registered you will receive a reset link shortly.</p></div>'));
  });

  app.get('/reset-password', async (req, res) => {
      const { token } = req.query;
      try {
          const uRes = await db.query('SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > CURRENT_TIMESTAMP', [token]);
          if(uRes.rows.length > 0) {
             res.send(renderLayout('Reset Password', `
              <div class="login-container">
                <h1>Reset Password</h1>
                <form method="POST" action="/reset-password">
                   <input type="hidden" name="token" value="${escapeHtml(token as string)}">
                   <input type="password" name="password" placeholder="New Password" required>
                   <input type="password" name="confirm_password" placeholder="Confirm New Password" required>
                   <button type="submit">RESET PASSWORD</button>
                </form>
              </div>`));
          } else {
             res.send(renderLayout('Invalid Token', '<div class="login-container"><p>Invalid or expired reset token.</p></div>'));
          }
      } catch(e) {
          res.send("Error");
      }
  });

  app.post('/reset-password', async (req, res) => {
      const { token, password, confirm_password } = req.body;
      try {
          if(!password || password !== confirm_password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
              return res.send(renderLayout('Error', '<div class="login-container"><p>Invalid password. Passwords must match, be at least 8 characters, and include uppercase, lowercase, and a number.</p></div>'));
          }
          const uRes = await db.query('SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > CURRENT_TIMESTAMP', [token]);
          if(uRes.rows.length > 0) {
              const user = uRes.rows[0];
              const pHash = await bcrypt.hash(password, 10);
              await db.query('UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2', [pHash, user.id]);
              await db.query('UPDATE user_sessions SET is_valid = FALSE WHERE user_id = $1', [user.id]);
              res.redirect('/login?reset=success');
          } else {
              res.send(renderLayout('Invalid Token', '<div class="login-container"><p>Invalid or expired reset token.</p></div>'));
          }
      } catch(e) {
          res.send("Error");
      }
  });


  app.get('/login', (req, res) => {
    let globalError = '';
    let successBanner = '';
    if (req.query.verified === 'invalid') globalError = "This verification link is invalid or has already been used.";
    if (req.query.reset === 'success') successBanner = "Your password has been reset. Please sign in with your new password.";
    if (req.query.registered === 'true') successBanner = "Account created successfully. Please sign in.";
    res.send(renderLogin({}, globalError, {}, successBanner));
  });

  app.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const errors: any = {};
        const formData = { identifier };

        if (!identifier) errors.identifier = "Please enter your username or email.";
        if (!password) errors.password = "Please enter your password.";

        if (Object.keys(errors).length > 0) {
          return res.send(renderLogin(formData, '', errors));
        }

        if(await checkBruteForce(identifier, req.ip || '')) {
           return res.status(429).send(renderLogin(formData, "Too many failed login attempts. Please wait 15 minutes before trying again."));
        }

        const uRes = await db.query('SELECT * FROM users WHERE username = $1 OR email = $1', [identifier]);
        if (uRes.rows.length === 0) {
           await logAttempt(identifier, req.ip || '', false);
           return res.send(renderLogin(formData, "Invalid credentials. Please try again."));
        }

        const user = uRes.rows[0] as any;
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
           await logAttempt(identifier, req.ip || '', false);
           return res.send(renderLogin(formData, "Invalid credentials. Please try again."));
        }
        
        await logAttempt(identifier, req.ip || '', true);

        if (!user.is_active) return res.send(renderLogin(formData, "Your account has been deactivated. Please contact support."));
        
        

        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        
        const token = crypto.randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await db.query(
          "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)",
          [user.id, token, expiresAt]
        );

        if (user.role === 'admin') {
            return res.send(renderLogin(formData, "This is the customer login. Please use the Administrator login page. <a href='/admin/login' style='color:inherit; text-decoration:underline;'>Go here</a>"));
        }
        res.cookie('dolphi_session', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'none', secure: true });
        res.redirect('/chat');

    } catch (e: any) {
      console.error(e);
      const formData = { identifier: req.body.identifier };
      res.send(renderLogin(formData, "An unexpected error occurred. Please try again."));
    }
  });

  app.get('/logout', async (req, res) => {
    const token = req.cookies['dolphi_session'];
    if (token) {
      try {
        await db.query("UPDATE user_sessions SET is_valid = FALSE WHERE session_token = $1", [token]);
        res.clearCookie('dolphi_session', { sameSite: 'none', secure: true });
      } catch (e) {
        console.error(e);
      }
    }
    res.redirect('/login');
  });

  // Admin routes
  app.get('/admin/login', (req, res) => {
    res.send(renderAdminLogin());
  });

  app.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const errors: any = {};
        const formData = { username };

        if (!username) errors.username = "Please enter your username.";
        if (!password) errors.password = "Please enter your password.";

        if (Object.keys(errors).length > 0) {
          return res.send(renderAdminLogin(formData, '', errors));
        }
        
        if(await checkBruteForce(username, req.ip || '')) {
           return res.status(429).send(renderAdminLogin(formData, "Too many failed login attempts. Please wait 15 minutes before trying again."));
        }

        const uRes = await db.query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
        if (uRes.rows.length === 0) {
           await logAttempt(username, req.ip || '', false);
           return res.send(renderAdminLogin(formData, "Invalid credentials. Please try again."));
        }

        const user = uRes.rows[0] as any;
        if (user.role !== 'admin') { return res.send(renderAdminLogin(formData, "This is the administrator login. Please use the Customer login page.")); }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
           await logAttempt(username, req.ip || '', false);
           return res.send(renderAdminLogin(formData, "Invalid credentials. Please try again."));
        }
        
        await logAttempt(username, req.ip || '', true);

        if (!user.is_active) return res.send(renderAdminLogin(formData, "Your account has been deactivated. Please contact support."));
        if (user.role !== 'admin') return res.send(renderAdminLogin(formData, "This account does not have admin privileges."));

        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        
        const token = crypto.randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
        await db.query(
          "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)",
          [user.id, token, expiresAt]
        );

        res.cookie('dolphi_admin_session', token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000, sameSite: 'none', secure: true });
        res.redirect('/admin');

    } catch (e: any) {
      console.error(e);
      const formData = { username: req.body.username };
      res.send(renderAdminLogin(formData, "An unexpected error occurred. Please try again."));
    }
  });

  app.get('/admin/logout', async (req, res) => {
    const token = req.cookies['dolphi_admin_session'];
    if (token) {
      try {
        await db.query("UPDATE user_sessions SET is_valid = FALSE WHERE session_token = $1", [token]);
        res.clearCookie('dolphi_admin_session', { sameSite: 'none', secure: true });
      } catch (e) {
        console.error(e);
      }
    }
    res.redirect('/admin/login');
  });

  app.get('/api/me', async (req, res) => {
    const token = req.cookies['dolphi_session'];
    if (!token) return res.json(null);
    try {
      const uRes = await db.query(`
        SELECT u.username FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = $1 AND s.is_valid = TRUE AND s.expires_at > CURRENT_TIMESTAMP
      `, [token]);
      res.json(uRes.rows[0] || null);
    } catch (e) {
      res.json(null);
    }
  });
  
  app.get('/api/admin/me', async (req, res) => {
    const token = req.cookies['dolphi_admin_session'];
    if (!token) return res.json(null);
    try {
      const uRes = await db.query(`
        SELECT u.username FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = $1 AND s.is_valid = TRUE AND s.expires_at > CURRENT_TIMESTAMP
        AND u.role = 'admin'
      `, [token]);
      res.json(uRes.rows[0] || null);
    } catch (e) {
      res.json(null);
    }
  });

  app.get('/', (req, res) => {
    res.send(renderRoleSelection());
  });

  function escapeHtml(unsafe: string) {
      return (unsafe||'').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
