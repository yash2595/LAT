<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
if (isset($_SESSION['user_id'])) { header('Location: /dashboard.html'); exit; }
$pageTitle='Create Account — MyLAT'; $asideVariant='register'; $asideTitle='Prove Your Skills. Unlock Your Future.'; $asideLead='Take the assessment. Stand out. Move closer to your dream career.';
?>
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title><?= htmlspecialchars($pageTitle) ?></title><link rel="icon" href="assets/css/favicon.ico"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="assets/css/auth-v3.css"></head>
<body><div class="auth"><?php require __DIR__ . '/../src/core/auth_aside.php'; ?><main class="main"><div class="top"><img class="m-logo" src="assets/mylat-logo.png" alt="MyLAT"></div>
<div class="shell"><section class="card is-login" id="regCard" data-step="1">
<div class="body">
    <style>
        .login-header-group h2 { margin: 0; font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .login-header-group .blue-line { width: 48px; height: 4px; background: #3b82f6; border-radius: 2px; margin: 12px 0 20px 0; }
        .btn-outline-blue { background: transparent; color: #60a5fa; border: 2px solid #3b82f6; transition: all 0.2s; }
        .btn-outline-blue:hover { background: #3b82f6; color: #fff; }
        .btn-outline-white { background: rgba(255,255,255,0.03); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15); transition: all 0.2s; }
        .btn-outline-white:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }
    </style>
    <form id="registerForm" novalidate autocomplete="off">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; color: #60a5fa; margin-bottom: 8px;">
            👋 <span>Welcome to MyLAT</span>
        </div>
        <div class="login-header-group">
            <h2 id="regTitle">Create Account</h2>
            <div class="blue-line"></div>
        </div>
        <p class="sub" id="regSub" style="margin-bottom: 32px; color: #cbd5e1; font-size: 15px;">Takes a minute. We'll email you a code to confirm.</p>
        
        <style>
            .form-grid { display: grid; grid-template-columns: 1fr; gap: 0 24px; }
            .field.inline-field {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 16px;
            }
            @media (min-width: 900px) {
                .field.inline-field {
                    flex-direction: row;
                    align-items: center;
                    gap: 12px;
                }
                .field.inline-field > label {
                    margin-bottom: 0 !important;
                    width: 115px;
                    flex-shrink: 0;
                    justify-content: flex-start !important;
                }
                .field.inline-field > div {
                    flex: 1;
                    min-width: 0;
                }
            }
        </style>
        <div class="form-grid">
            <div class="field inline-field full-width">
                <label for="full_name" style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; color: #94a3b8;">
                    <svg class="ico" style="width: 16px; height: 16px; color: #60a5fa;"><use href="#i-user"/></svg> <span>FULL NAME</span>
                </label>
                <div class="ctl" style="width: 100%;">
                    <input type="text" id="full_name" name="full_name" placeholder="As you want it on your certificate" autocomplete="name" required style="border-radius: 12px; padding: 0 16px;">
                </div>
            </div>
            
            <div class="field inline-field">
                <label for="email" style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; color: #94a3b8;">
                    <svg class="ico" style="width: 16px; height: 16px; color: #60a5fa;"><use href="#i-mail"/></svg> <span>EMAIL ADDRESS</span>
                </label>
                <div class="ctl" style="width: 100%;">
                    <input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" required style="border-radius: 12px; padding: 0 16px;">
                </div>
            </div>
            
            <div class="field inline-field">
                <label for="phone" style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; color: #94a3b8;">
                    <svg class="ico" style="width: 16px; height: 16px; color: #60a5fa;"><use href="#i-phone"/></svg> <span>PHONE NUMBER</span>
                </label>
                <div class="phone" style="width: 100%;">
                    <select id="country_code" aria-label="Country code" style="border-radius: 12px; border: 1.5px solid var(--line);">
                        <option value="+91" selected>+91</option><option value="+1">+1</option><option value="+44">+44</option><option value="+61">+61</option><option value="+65">+65</option><option value="+81">+81</option><option value="+971">+971</option><option value="+92">+92</option>
                    </select>
                    <div class="ctl" style="flex: 1;">
                        <input type="tel" id="phone" inputmode="numeric" maxlength="15" placeholder="98765 43210" autocomplete="tel-national" required style="border-radius: 12px; padding: 0 16px; padding-left: 16px;">
                    </div>
                </div>
            </div>
            
            <div class="field inline-field" style="position: relative;">
                <label for="password" style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; color: #94a3b8;">
                    <svg class="ico" style="width: 16px; height: 16px; color: #60a5fa;"><use href="#i-lock"/></svg> <span>PASSWORD</span>
                </label>
                <div style="flex: 1; width: 100%;">
                    <div class="ctl pw" style="width: 100%;">
                        <input type="password" id="password" name="password" placeholder="At least 8 characters" autocomplete="new-password" required style="border-radius: 12px; padding: 0 16px; padding-right: 56px;">
                        <button type="button" class="eye ib-toggle-password" data-target="password" aria-label="Show password"><svg class="ico on-i"><use href="#i-eye"/></svg><svg class="ico off"><use href="#i-eyeoff"/></svg></button>
                    </div>
                    <div class="meter" id="meter" data-s="0" style="margin-top: 8px;"><i></i><i></i><i></i><i></i><span id="meterLabel"></span></div>
                </div>
            </div>
            
            <div class="field inline-field" style="position: relative;">
                <label for="confirm_password" style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; color: #94a3b8;">
                    <svg class="ico" style="width: 16px; height: 16px; color: #60a5fa;"><use href="#i-lock"/></svg> <span>CONFIRM PASSWORD</span>
                </label>
                <div style="flex: 1; width: 100%;">
                    <div class="ctl pw" style="width: 100%;">
                        <input type="password" id="confirm_password" name="confirm_password" placeholder="Re-enter your password" autocomplete="new-password" required style="border-radius: 12px; padding: 0 16px; padding-right: 56px;">
                        <button type="button" class="eye ib-toggle-password" data-target="confirm_password" aria-label="Show password"><svg class="ico on-i"><use href="#i-eye"/></svg><svg class="ico off"><use href="#i-eyeoff"/></svg></button>
                    </div>
                    <p class="hint" id="matchHint" style="margin-top: 8px; margin-bottom: 0;"></p>
                </div>
            </div>
        </div>
        
        <div id="formAlert" class="alert" role="alert"></div>
        <button type="submit" class="btn btn-outline-blue" id="registerBtn" data-label="CREATE ACCOUNT" style="width: 100%; font-weight: 700; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; gap: 10px; border-radius: 12px; height: 56px; display: flex; justify-content: center; align-items: center;">
            <svg class="ico" style="width: 20px; height: 20px; stroke-width: 2.5;"><use href="#i-user"/></svg> CREATE ACCOUNT
        </button>
        <p class="foot" style="margin-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
            By creating an account you agree to our <a href="terms.html" style="color: #60a5fa;">Terms</a> and <a href="privacy.html" style="color: #60a5fa;">Privacy Policy</a>.
        </p>

        <div style="display: flex; align-items: center; text-align: center; margin: 20px 0; color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: 1px;">
            <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
            <span style="padding: 0 20px;">OR</span>
            <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
        </div>

        <div style="text-align: center;">
            <p style="color: #94a3b8; font-size: 15px; margin-bottom: 12px;">Already have an account?</p>
            <a href="login.php" class="btn btn-outline-white" style="width: 100%; font-weight: 600; font-size: 15px; gap: 10px; border-radius: 12px; height: 56px; display: flex; justify-content: center; align-items: center; text-decoration: none;">
                <svg class="ico" style="width: 18px; height: 18px; stroke-width: 2.5;"><use href="#i-login-arrow"/></svg> Log In Here
            </a>
        </div>

        <p class="foot" style="margin-top: 20px; font-size: 13px; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg class="ico" style="width: 16px; height: 16px; color: #10b981; stroke-width: 2.5;"><use href="#i-shield"/></svg> 256-bit SSL Encrypted &bull; <b style="color:#60a5fa;">MyLAT</b>
        </p>
    </form>
    
    <form id="otpForm" class="d-none" novalidate>
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; color: #60a5fa; margin-bottom: 8px;">
            ✉️ <span>Verification</span>
        </div>
        <div class="login-header-group">
            <h2>Check your email</h2>
            <div class="blue-line"></div>
        </div>
        <p class="sub" style="margin-bottom: 32px; color: #cbd5e1; font-size: 15px;">We sent a 6-digit code to</p>
        
        <div class="otp-mail" style="border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); margin-bottom: 32px; width: 100%; justify-content: center; padding: 14px;">
            <svg class="ico" style="color: #60a5fa;"><use href="#i-mail"/></svg><strong id="otpEmailDisplay" style="color: #fff;"></strong>
        </div>
        
        <div class="field" style="margin-bottom: 24px;">
            <label for="otp1" style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; color: #94a3b8;">
                <svg class="ico" style="width: 16px; height: 16px; color: #60a5fa;"><use href="#i-check"/></svg> <span>VERIFICATION CODE</span>
            </label>
            <div class="otp-boxes" id="otpBoxes">
                <input type="text" id="otp1" inputmode="numeric" maxlength="6" autocomplete="one-time-code" aria-label="Digit 1" style="border-radius: 12px;">
                <input type="text" inputmode="numeric" maxlength="1" aria-label="Digit 2" style="border-radius: 12px;">
                <input type="text" inputmode="numeric" maxlength="1" aria-label="Digit 3" style="border-radius: 12px;">
                <input type="text" inputmode="numeric" maxlength="1" aria-label="Digit 4" style="border-radius: 12px;">
                <input type="text" inputmode="numeric" maxlength="1" aria-label="Digit 5" style="border-radius: 12px;">
                <input type="text" inputmode="numeric" maxlength="1" aria-label="Digit 6" style="border-radius: 12px;">
            </div>
            <input type="hidden" id="otp_code">
        </div>
        
        <div id="otpAlert" class="alert" role="alert"></div>
        
        <button type="submit" class="btn btn-outline-blue" id="verifyOtpBtn" data-label="VERIFY AND CREATE ACCOUNT" style="width: 100%; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-radius: 12px; height: 56px;">
            <svg class="ico" style="width: 20px; height: 20px; stroke-width: 2.5; margin-right: 8px;"><use href="#i-check"/></svg> VERIFY AND CREATE ACCOUNT
        </button>
        
        <p class="foot" style="margin-top: 32px; font-size: 14px; color: #94a3b8;">
            Didn't get it? <button type="button" class="link" id="resendOtpBtn" style="color: #60a5fa;">Resend code</button><br><br>
            <button type="button" class="link" id="backToDetails" style="color: #cbd5e1; font-size: 13px;">Use a different email</button>
        </p>
    </form>
</div>
</section></div></main></div><script src="assets/js/auth.js"></script></body></html>