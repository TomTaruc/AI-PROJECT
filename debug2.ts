async function test() {
   const baseUrl = 'http://localhost:3000';
   const r = await fetch(baseUrl + '/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             full_name: 'Audit Five', username: 'audit_five', email: 'five@test.com', 
             password: 'Password123!', confirm_password: 'Password123!'
          })
      });
      console.log(await r.text());
}
test();
