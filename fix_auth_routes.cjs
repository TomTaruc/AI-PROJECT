const fs = require('fs');

let file = fs.readFileSync('auth_routes.ts', 'utf8');

// 1. Role Selection Render
const roleSelectFunc = `  function renderRoleSelection() {
    return renderLayout('Welcome to DOLPHI', \`
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
    \`);
  }
`;

if (!file.includes('renderRoleSelection')) {
  file = file.replace('function renderRegister', roleSelectFunc + '\n  function renderRegister');
}

// 2. Modify renderRegister
file = file.replace('<h1>Create Account</h1>', '<h1>Create Customer Account</h1>');
file = file.replace('<div class="sub-head">Join DOLPHI Customer Service</div>', '<div class="sub-head">Register to use DOLPHI customer service</div>\n<div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 10px 14px; color: #1D4ED8; font-size: 12px; margin-bottom: 20px; text-align: center;">Note: This form is for customer accounts only. If you are an administrator, please contact your system administrator for access.</div>');

// Remove access code from renderRegister
const aStart = file.indexOf('<div style="text-align: center; font-size: 11px; color: #94A3B8; letter-spacing: 0.1em; margin-bottom: 16px;">Administrator Access</div>');
if (aStart !== -1) {
   const aEnd = file.indexOf('<button type="submit">', aStart);
   file = file.substring(0, aStart) + file.substring(aEnd);
}

// 3. Modify renderLogin
file = file.replace('<h1>Welcome Back</h1>', '<h1>Customer Login</h1>');
file = file.replace('<div class="sub-head">Sign in to DOLPHI</div>', '<div class="sub-head">Sign in to access DOLPHI support</div>');
file = file.replace("Don't have an account? <a href=\"/register\">Register here</a>", "Don't have an account? <a href=\"/register\">Register here</a><br><br><span style=\"color: #94A3B8; font-size: 13px;\">Administrator? </span><a href=\"/admin/login\" style=\"color: #94A3B8; text-decoration: underline;\">Go to Admin Login</a>");

// 4. Modify renderAdminLogin
file = file.replace('<h1>DOLPHI Admin</h1>', '<h1>Administrator Login</h1>');
file = file.replace('<div class="sub-head">Restricted Access</div>', '<div class="sub-head" style="color: #F5C518; font-size: 12px; letter-spacing: 0.1em;">Restricted access — authorized personnel only</div>');
file = file.replace("<a href=\"/login\">User login</a>", "<span style=\"color: #475569;\">Customer login</span> <a href=\"/login\" style=\"color: #F5C518; text-decoration: underline;\">Go to Customer Login</a>");


// 5. Registration redirect logic
const finalRoleStart = file.indexOf("if (finalRole === 'admin') {");
if (finalRoleStart !== -1) {
   const finalRoleEnd = file.indexOf("        }", file.indexOf("} else {", finalRoleStart)) + 9;
   file = file.substring(0, finalRoleStart) +
     "res.cookie('dolphi_session', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'none', secure: true });\n        return res.redirect('/login?registered=true');" +
     file.substring(finalRoleEnd);
}

// 6. Login check
const adminLoginCheck = file.indexOf("if (user.role === 'admin') {");
if (adminLoginCheck !== -1 && file.substring(adminLoginCheck, adminLoginCheck + 200).includes("res.redirect('/admin');")) {
   const checkEnd = file.indexOf("        }", file.indexOf("} else {", adminLoginCheck)) + 9;
   file = file.substring(0, adminLoginCheck) + 
   "if (user.role === 'admin') {\n            return res.send(renderLogin(formData, \"This is the customer login. Please use the Administrator login page. <a href='/admin/login' style='color:inherit; text-decoration:underline;'>Go here</a>\"));\n        }\n        res.cookie('dolphi_session', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'none', secure: true });\n        res.redirect('/chat');" +
   file.substring(checkEnd);
}

// 7. Success Banner
file = file.replace("if (req.query.reset === 'success') successBanner = \"Your password has been reset. Please sign in with your new password.\";", "if (req.query.reset === 'success') successBanner = \"Your password has been reset. Please sign in with your new password.\";\n    if (req.query.registered === 'true') successBanner = \"Account created successfully. Please sign in.\";");

// 8. Admin login validation
const adminPostStart = file.indexOf("app.post('/admin/login', async (req, res) => {");
if (adminPostStart !== -1) {
   const userMatch = file.indexOf("const user = uRes.rows[0] as any;", adminPostStart);
   if (userMatch !== -1) {
      file = file.substring(0, userMatch + 33) + "\n        if (user.role !== 'admin') { return res.send(renderAdminLogin(formData, \"This is the administrator login. Please use the Customer login page.\")); }\n" + file.substring(userMatch + 33);
   }
}

// 9. Root route
if (!file.includes("app.get('/'")) {
   file += `\n  app.get('/', (req, res) => {\n    res.send(renderRoleSelection());\n  });\n`;
}

fs.writeFileSync('auth_routes.ts', file);
