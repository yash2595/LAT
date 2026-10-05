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
$asideTitle = 'Welcome back, climber.';
$asideLead = 'Pick up your climb where you left off. Your levels, scores and verified certificates are waiting on your dashboard.';
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
<main class="main"><div class="top"><img class="m-logo" src="assets/css/internboot-official-logo.webp" alt="InternBoot"><p>New to InternBoot? <a href="register.php">Create an account</a></p></div>
<div class="shell"><section class="card is-login has-stub">
<header class="tk"><span class="tk-ico"><svg class="ico"><use href="#i-cap"/></svg></span><div class="tk-t"><b>Candidate login</b><small>Level Assessment Test</small></div><span class="tk-pill"><svg class="ico"><use href="#i-shield"/></svg>Secure</span></header><div class="perf"></div>
<div class="body"><h2>Welcome back</h2><p class="sub">Log in to continue your climb to the top.</p>
<form id="loginForm" novalidate>
<div class="field"><label for="email">Email address</label><div class="ctl"><svg class="ico"><use href="#i-mail"/></svg><input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" required></div></div>
<div class="field"><div class="lrow"><label for="password" style="margin:0">Password</label><a href="forgot-password.php">Forgot password?</a></div><div class="ctl pw"><svg class="ico"><use href="#i-lock"/></svg><input type="password" id="password" name="password" placeholder="Enter your password" autocomplete="current-password" required><button type="button" class="eye ib-toggle-password" data-target="password" aria-label="Show password"><svg class="ico on-i"><use href="#i-eye"/></svg><svg class="ico off"><use href="#i-eyeoff"/></svg></button></div></div>
<div id="formAlert" class="alert" role="alert"></div><button type="submit" class="btn" id="loginBtn" data-label="Log in">Log in</button></form>
<p class="foot"><svg class="ico"><use href="#i-lock"/></svg>Your data is encrypted in transit.</p></div><div class="perf"></div>
<footer class="stub" aria-hidden="true"><span class="bars"></span><div class="stub-t"><b>Admit one climber</b><small>Level Assessment Test</small></div><span class="stub-lv"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i></span></footer>
</section></div></main></div><script src="assets/js/auth.js"></script></body></html>