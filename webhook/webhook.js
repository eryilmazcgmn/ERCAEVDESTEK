const SECRET = process.env.WEBHOOK_SECRET;

if (!SECRET) {
    console.error('WEBHOOK_SECRET tanımlı değil.');
    process.exit(1);
}