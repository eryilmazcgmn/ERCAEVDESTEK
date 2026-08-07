## Secrets required for production

- JWT_SECRET (minimum 32 characters): used by JWT service. Set in backend/.env as JWT_SECRET.
- ADMIN_OPERATION_SECRET: secret used to protect admin operations (/api/admin/run-migrations, /api/admin/clear-cache, /api/admin/link-storage) when app.env !== local.

How to create:
- Generate a strong random key: `php -r "echo bin2hex(random_bytes(32));"`
- Add to your environment (do NOT commit).
Rotation:
- Rotate key via deploy process; update environment and restart service. Consider vaulting secrets (Hashicorp Vault, AWS Secrets Manager).

