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
$asideTitle = 'Climb 5 levels. Get hired.';
$asideLead  = 'Take your Level Assessment Test, clear Levels 1 to 5 and unlock placement opportunities with verified certificates.';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($pageTitle) ?></title>
<link rel="icon" href="assets/css/favicon.ico">
<link rel="stylesheet" href="assets/css/auth-v2.css">
</head>
<body>
<div class="auth">
<?php require __DIR__ . '/../src/core/auth_aside.php'; ?>
<main class="main">
  <div class="top">
    <img class="m-logo" src="assets/css/internboot-official-logo.webp" alt="InternBoot">
    <p>New to InternBoot? <a href="register.php">Create an account</a></p>
  </div>
  <section class="card">
    <h2>Log in</h2>
    <p class="sub">Welcome back. Enter your details to open your dashboard.</p>
    <form id="loginForm" novalidate>
      <div class="field"><label for="email">Email address</label>
        <div class="ctl"><svg class="ico"><use href="#i-mail"/></svg><input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" required></div></div>
      <div class="field"><div class="lrow"><label for="password" style="margin:0">Password</label><a href="forgot-password.php">Forgot password?</a></div>
        <div class="ctl pw"><svg class="ico"><use href="#i-lock"/></svg><input type="password" id="password" name="password" placeholder="Enter your password" autocomplete="current-password" required><button type="button" class="eye ib-toggle-password" data-pw data-target="password" aria-label="Show password"><svg class="ico on-i"><use href="#i-eye"/></svg><svg class="ico off"><use href="#i-eyeoff"/></svg></button></div></div>
      <div id="formAlert" class="alert" role="alert"></div>
      <button type="submit" class="btn" id="loginBtn"><span>Log in</span></button>
    </form>
    <p class="foot">Your data is encrypted in transit.</p>
  </section>
</main>
</div>
<script src="assets/js/auth.js"></script>
</body>
</html>