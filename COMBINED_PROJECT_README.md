# InternBoot Combined Project

Main/base: first ZIP. Landing page and landing-specific design/assets are preserved from the first ZIP.
Student dashboard/workflows and Admin dashboard/workflows are fully included from the second ZIP, including their APIs, modules, database schema, vendor dependencies and supporting assets.

Included functionality:
- Authentication: login, register, logout, OTP, password reset, CSRF
- Student dashboard/profile
- Enrollment and payment
- Batch/slot availability, preferences, booking, cancellation, auto-batch
- Exam engine: start, questions, save answers, status, violations, submit
- Results/evaluation
- AI question bank: generate/add/review workflow
- Admin dashboard, candidates, batches, questions, results, certificates, placement, settings
- Certificate generation/PDF/verification
- Admin/staff APIs
- Profile/contact APIs
- Composer/vendor dependencies

Run:
1. Configure .env for your environment.
2. Ensure PHP 8.2+ and required extensions are installed.
3. Run composer install if dependencies need rebuilding.
4. Serve public as the web root: php -S localhost:8000 -t public
5. Apply schema.sql/setup scripts for your database.

The existing .env may contain credentials. Keep it private and never commit it.
