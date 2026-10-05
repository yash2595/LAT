// Path: public/assets/js/auth.js
function showAlert(box,type,message){if(!box)return;box.classList.remove('d-none','error','success');box.classList.add(type,'show');box.textContent=message}
function hideAlert(box){if(!box)return;box.classList.remove('show','error','success');box.textContent=''}
async function postJson(url,payload){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});return res.json()}
function setBusy(btn,text){btn.disabled=true;btn.classList.add('is-busy');btn.textContent=text}
function setIdle(btn,text){btn.disabled=false;btn.classList.remove('is-busy');btn.textContent=text||btn.dataset.label||btn.textContent}
document.querySelectorAll('.ib-role-card').forEach(card=>card.addEventListener('click',()=>{const group=card.closest('.ib-role-group');group.querySelectorAll('.ib-role-card').forEach(c=>c.classList.remove('selected'));card.classList.add('selected');card.querySelector('input[type="radio"]').checked=true}));
document.querySelectorAll('.ib-toggle-password').forEach(btn=>btn.addEventListener('click',()=>{const input=document.getElementById(btn.dataset.target);if(input.type==='password'){input.type='text';btn.classList.add('is-visible');btn.setAttribute('aria-label','Hide password')}else{input.type='password';btn.classList.remove('is-visible');btn.setAttribute('aria-label','Show password')}}));
let pendingEmail='';
const regPassword=document.getElementById('password'),regConfirm=document.getElementById('confirm_password'),meter=document.getElementById('meter'),meterLabel=document.getElementById('meterLabel'),matchHint=document.getElementById('matchHint'),phoneInput=document.getElementById('phone');
function scorePassword(p){if(!p)return 0;if(p.length<8)return 1;let s=1;if(p.length>=12)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p)&&/[^A-Za-z0-9]/.test(p))s++;return Math.min(s,4)}
function refreshPasswordUi(){if(meter&&regPassword){const p=regPassword.value,s=scorePassword(p);meter.dataset.s=String(s);meterLabel.textContent=!p?'':(p.length<8?'Too short':['','Weak','Fair','Good','Strong'][s])}if(matchHint&&regConfirm){if(!regConfirm.value){matchHint.textContent='';matchHint.className='hint'}else if(regConfirm.value===regPassword.value){matchHint.textContent='Passwords match';matchHint.className='hint ok'}else{matchHint.textContent='Passwords don’t match yet';matchHint.className='hint bad'}}}
if(regPassword&&meter){regPassword.addEventListener('input',refreshPasswordUi);if(regConfirm)regConfirm.addEventListener('input',refreshPasswordUi)}
if(phoneInput)phoneInput.addEventListener('input',()=>{phoneInput.value=phoneInput.value.replace(/[^\d\s]/g,'')});
function setRegStep(step){const card=document.getElementById('regCard');if(!card)return;card.dataset.step=String(step);const s1=card.querySelector('.tk-steps .s1'),s2=card.querySelector('.tk-steps .s2');if(!s1||!s2)return;s1.classList.toggle('on',step===1);s1.classList.toggle('done',step===2);s2.classList.toggle('on',step===2)}
const registerForm=document.getElementById('registerForm');
if(registerForm)registerForm.addEventListener('submit',async function(e){e.preventDefault();const btn=document.getElementById('registerBtn'),alertBox=document.getElementById('formAlert');hideAlert(alertBox);const payload={full_name:document.getElementById('full_name').value.trim(),email:document.getElementById('email').value.trim(),phone:`${document.getElementById('country_code').value}${document.getElementById('phone').value.replace(/\D/g,'')}`,password:document.getElementById('password').value,confirm_password:document.getElementById('confirm_password').value};if(payload.password!==payload.confirm_password){showAlert(alertBox,'error','Passwords do not match.');return}setBusy(btn,'Sending code...');try{const data=await postJson('/api/auth/register.php',payload);if(data.status==='success'){pendingEmail=payload.email;document.getElementById('otpEmailDisplay').textContent=pendingEmail;registerForm.classList.add('d-none');document.getElementById('otpForm').classList.remove('d-none');setRegStep(2);setIdle(btn);const first=document.querySelector('#otpBoxes input');if(first)first.focus();startResendCooldown()}else{showAlert(alertBox,'error',data.message||'Registration failed.');setIdle(btn)}}catch(err){showAlert(alertBox,'error','Something went wrong. Please try again.');setIdle(btn)}});
const otpBoxes=Array.from(document.querySelectorAll('#otpBoxes input')),otpHidden=document.getElementById('otp_code');
function syncOtp(){if(!otpHidden)return;otpHidden.value=otpBoxes.map(b=>b.value).join('');otpBoxes.forEach(b=>b.classList.toggle('filled',b.value!==''))}
function fillOtp(digits,from){digits.split('').forEach((d,k)=>{if(otpBoxes[from+k])otpBoxes[from+k].value=d});syncOtp();const next=Math.min(from+digits.length,otpBoxes.length-1);otpBoxes[next].focus()}
otpBoxes.forEach((box,i)=>{box.addEventListener('input',()=>{const digits=box.value.replace(/\D/g,'');if(digits.length>1){box.value='';fillOtp(digits.slice(0,otpBoxes.length-i),i);return}box.value=digits;syncOtp();if(digits&&i<otpBoxes.length-1)otpBoxes[i+1].focus()});box.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!box.value&&i>0){otpBoxes[i-1].value='';otpBoxes[i-1].focus();syncOtp();e.preventDefault()}else if(e.key==='ArrowLeft'&&i>0)otpBoxes[i-1].focus();else if(e.key==='ArrowRight'&&i<otpBoxes.length-1)otpBoxes[i+1].focus()});box.addEventListener('paste',e=>{const text=(e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'');if(!text)return;e.preventDefault();fillOtp(text.slice(0,otpBoxes.length-i),i)});box.addEventListener('focus',()=>box.select())});
const otpForm=document.getElementById('otpForm');
if(otpForm)otpForm.addEventListener('submit',async function(e){e.preventDefault();const btn=document.getElementById('verifyOtpBtn'),alertBox=document.getElementById('otpAlert');hideAlert(alertBox);const payload={email:pendingEmail,otp:document.getElementById('otp_code').value.trim()};if(payload.otp.length<6){showAlert(alertBox,'error','Enter all 6 digits of the code.');return}setBusy(btn,'Verifying...');try{const data=await postJson('/api/auth/verify-otp.php',payload);if(data.status==='success'){showAlert(alertBox,'success','Account created! Taking you to login...');setBusy(btn,'Account created');setTimeout(()=>{window.location.href='/login.php'},1200)}else{showAlert(alertBox,'error',data.message||'Verification failed.');setIdle(btn)}}catch(err){showAlert(alertBox,'error','Something went wrong. Please try again.');setIdle(btn)}});
const resendBtn=document.getElementById('resendOtpBtn');let resendTimer=null;
function startResendCooldown(seconds=30){if(!resendBtn)return;clearInterval(resendTimer);let left=seconds;resendBtn.disabled=true;resendBtn.textContent=`Resend in ${left}s`;resendTimer=setInterval(()=>{left-=1;if(left<=0){clearInterval(resendTimer);resendBtn.disabled=false;resendBtn.textContent='Resend code'}else resendBtn.textContent=`Resend in ${left}s`},1000)}
if(resendBtn)resendBtn.addEventListener('click',async function(){const alertBox=document.getElementById('otpAlert');resendBtn.disabled=true;resendBtn.textContent='Resending...';try{const data=await postJson('/api/auth/resend-otp.php',{email:pendingEmail});showAlert(alertBox,data.status==='success'?'success':'error',data.message)}catch(err){showAlert(alertBox,'error','Could not resend code.')}startResendCooldown()});
const backBtn=document.getElementById('backToDetails');
if(backBtn)backBtn.addEventListener('click',()=>{clearInterval(resendTimer);otpBoxes.forEach(b=>{b.value=''});syncOtp();hideAlert(document.getElementById('otpAlert'));document.getElementById('otpForm').classList.add('d-none');document.getElementById('registerForm').classList.remove('d-none');setRegStep(1);const em=document.getElementById('email');if(em)em.focus()});
const loginForm=document.getElementById('loginForm');
if (loginForm) {
  const emailInput = document.getElementById('email');
  const asideTitle = document.querySelector('.hero h1');
  if (emailInput && asideTitle) {
    let debounceTimer;
    emailInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const email = emailInput.value.trim();
        if (email.includes('@') && email.length > 5) {
          try {
            const res = await postJson('/api/auth/check_email.php', { email });
            if (res.status === 'success' && res.name) {
              asideTitle.textContent = `Welcome back, ${res.name}.`;
            } else {
              asideTitle.textContent = 'Welcome back, Candidate.';
            }
          } catch(e) {
            asideTitle.textContent = 'Welcome back, Candidate.';
          }
        } else {
          asideTitle.textContent = 'Welcome back, Candidate.';
        }
      }, 500);
    });
  }
  
  loginForm.addEventListener('submit',async function(e){e.preventDefault();const btn=document.getElementById('loginBtn'),alertBox=document.getElementById('formAlert');hideAlert(alertBox);const payload={email:document.getElementById('email').value.trim(),password:document.getElementById('password').value,role:loginForm.querySelector('input[name="role"]:checked')?.value};setBusy(btn,'Logging in...');try{const data=await postJson('/api/auth/login.php',payload);if(data.status==='success'){showAlert(alertBox,'success',data.message);setBusy(btn,'Taking you in...');const redirect=(data.data&&data.data.redirect)||'/dashboard.html';setTimeout(()=>{window.location.href=redirect},600)}else{showAlert(alertBox,'error',data.message||'Login failed.');setIdle(btn)}}catch(err){showAlert(alertBox,'error','Something went wrong. Please try again.');setIdle(btn)}});
}
const forgotForm=document.getElementById('forgotPasswordForm');
if(forgotForm)forgotForm.addEventListener('submit',async function(e){e.preventDefault();const btn=document.getElementById('forgotBtn'),alertBox=document.getElementById('forgotFormAlert');const payload={email:document.getElementById('email').value.trim()};btn.disabled=true;btn.textContent='Sending...';try{const data=await postJson('/api/auth/forgot-password.php',payload);if(data.status==='success')showAlert(alertBox,'success',data.message);else showAlert(alertBox,'error',data.message||'Failed to send reset link.')}catch(err){showAlert(alertBox,'error','Something went wrong. Please try again.')}finally{btn.disabled=false;btn.textContent='Send Reset Link'}});
const resetForm=document.getElementById('resetPasswordForm');
if(resetForm)resetForm.addEventListener('submit',async function(e){e.preventDefault();const btn=document.getElementById('resetBtn'),alertBox=document.getElementById('resetFormAlert');const payload={token:document.getElementById('resetToken').value,email:document.getElementById('resetEmail').value,new_password:document.getElementById('new_password').value,confirm_password:document.getElementById('confirm_password').value};if(payload.new_password!==payload.confirm_password){showAlert(alertBox,'error','Passwords do not match.');return}btn.disabled=true;btn.textContent='Resetting...';try{const data=await postJson('/api/auth/reset-password.php',payload);if(data.status==='success'){showAlert(alertBox,'success',data.message);setTimeout(()=>{window.location.href='/login.php'},2000)}else{showAlert(alertBox,'error',data.message||'Failed to reset password.');btn.disabled=false;btn.textContent='Reset Password'}}catch(err){showAlert(alertBox,'error','Something went wrong. Please try again.');btn.disabled=false;btn.textContent='Reset Password'}});