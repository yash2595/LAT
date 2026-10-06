<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
require_once __DIR__ . '/../src/core/candidate_resolver.php';

if (isset($_SESSION['user_id']) || isset($_SESSION['candidate_id'])) {
    $role = $_SESSION['role'] ?? $_SESSION['user_role'] ?? '';

    if (in_array($role, ['admin', 'staff'], true)) {
        $validatedRole = resolve_admin_role($conn);
        if ($validatedRole && in_array($validatedRole, ['admin', 'staff'], true)) {
            header('Location: /admin/index.html');
            exit;
        }
    } elseif ($role === 'candidate' || isset($_SESSION['candidate_id'])) {
        $validatedCid = validate_candidate_session($conn);
        if ($validatedCid !== null) {
            header('Location: /dashboard.html');
            exit;
        }
    } else {
        $validatedRole = resolve_admin_role($conn);
        if ($validatedRole && in_array($validatedRole, ['admin', 'staff'], true)) {
            header('Location: /admin/index.html');
            exit;
        }
        $validatedCid = validate_candidate_session($conn);
        if ($validatedCid !== null) {
            header('Location: /dashboard.html');
            exit;
        }
    }

    destroy_session();
}

$pageTitle = 'Log in — InternBoot';
$asideVariant = 'login';
$asideTitle = 'Welcome back, Candidate.';
$asideLead = 'Resume your journey. Your latest assessment scores, reports, and placement status are waiting on your dashboard.';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($pageTitle) ?></title>
<link rel="icon" href="assets/css/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/auth-v3.css">
</head>
<body><div class="auth">
<?php require __DIR__ . '/../src/core/auth_aside.php'; ?>
<main class="main"><div class="top"><img class="m-logo" src="assets/css/internboot-official-logo.webp" alt="InternBoot"></div>
<div class="shell"><section class="card is-login">
<div class="body">
    <style>
        .login-header-group h2 { margin: 0; font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .login-header-group .blue-line { width: 48px; height: 4px; background: #3b82f6; border-radius: 2px; margin: 12px 0 20px 0; }
        .btn-outline-blue { background: transparent; color: #60a5fa; border: 2px solid #3b82f6; transition: all 0.2s; }
        .btn-outline-blue:hover { background: #3b82f6; color: #fff; }
        .btn-outline-white { background: rgba(255,255,255,0.03); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15); transition: all 0.2s; }
        .btn-outline-white:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }
    </style>

    <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; color: #60a5fa; margin-bottom: 8px;">
        👋 <span>Welcome back</span>
    </div>
    <div class="login-header-group">
        <h2>Student Login</h2>
        <div class="blue-line"></div>
    </div>
    <p class="sub" style="margin-bottom: 32px; color: #cbd5e1; font-size: 15px;">Enter your credentials to access your dashboard</p>
    
    <form id="loginForm" novalidate>
        <div class="field" style="margin-bottom: 24px;">
            <label for="email" style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: #94a3b8;">
                <svg class="ico" style="width: 16px; height: 16px; color: #60a5fa;"><use href="#i-mail"/></svg> <span>EMAIL ADDRESS</span>
            </label>
            <div class="ctl">
                <input type="email" id="email" name="email" placeholder="Enter your email address" autocomplete="email" required style="border-radius: 12px; padding: 0 16px;">
            </div>
        </div>

        <div class="field" style="margin-bottom: 24px;">
            <label for="password" style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: #94a3b8;">
                <svg class="ico" style="width: 16px; height: 16px; color: #60a5fa;"><use href="#i-lock"/></svg> <span>PASSWORD</span>
            </label>
            <div class="ctl pw">
                <input type="password" id="password" name="password" placeholder="Enter your password" autocomplete="current-password" required style="border-radius: 12px; padding: 0 16px;">
                <button type="button" class="eye ib-toggle-password" data-target="password" aria-label="Show password"><svg class="ico on-i"><use href="#i-eye"/></svg><svg class="ico off"><use href="#i-eyeoff"/></svg></button>
            </div>
            <div style="text-align: right; margin-top: 12px;">
                <a href="forgot-password.php" style="font-size: 14px; color: #60a5fa; text-decoration: none; font-weight: 600;">Forgot Password?</a>
            </div>
        </div>

        <div id="formAlert" class="alert" role="alert"></div>
        <button type="submit" class="btn btn-outline-blue" id="loginBtn" style="width: 100%; font-weight: 700; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; gap: 10px; border-radius: 12px; height: 56px; display: flex; justify-content: center; align-items: center;">
            <svg class="ico" style="width: 20px; height: 20px; stroke-width: 2.5;"><use href="#i-login-arrow"/></svg> LOGIN TO DASHBOARD
        </button>
    </form>

    <div style="display: flex; align-items: center; text-align: center; margin: 32px 0; color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: 1px;">
        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
        <span style="padding: 0 20px;">OR</span>
        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
    </div>

    <div style="text-align: center;">
        <p style="color: #94a3b8; font-size: 15px; margin-bottom: 16px;">Don't have an account?</p>
        <a href="register.php" class="btn btn-outline-white" style="width: 100%; font-weight: 600; font-size: 15px; gap: 10px; border-radius: 12px; height: 56px; display: flex; justify-content: center; align-items: center; text-decoration: none;">
            <svg class="ico" style="width: 18px; height: 18px; stroke-width: 2.5;"><use href="#i-user"/></svg> Register Here
        </a>
    </div>

    <p class="foot" style="margin-top: 32px; font-size: 13px; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <svg class="ico" style="width: 16px; height: 16px; color: #10b981; stroke-width: 2.5;"><use href="#i-shield"/></svg> 256-bit SSL Encrypted &bull; <b style="color:#60a5fa;">InternBoot</b>
    </p>
</div>
</section></div></main></div><script src="assets/js/auth.js"></script></body></html>