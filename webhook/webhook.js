const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const SECRET = process.env.WEBHOOK_SECRET;

if (!SECRET) {
    console.error('Kritik Hata: WEBHOOK_SECRET tanimli degil.');
    process.exit(1);
}

app.use(express.json());

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        return res.status(401).send('İmza eksik.');
    }

    const hmac = crypto.createHmac('sha256', SECRET);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        console.log('Gecerli webhook alindi. Guncelleme baslatiliyor...');
        res.status(200).send('Deploy tetiklendi.');

        // Tam olarak sizin sunucunuzun yolunu yazdik
        const deployScriptPath = '/home/Eryil/ERCAEVDESTEK/deploy.sh'; 
        
        exec(`bash ${deployScriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Hata: ${error.message}`);
                return;
            }
            console.log(`Cikti:\n${stdout}`);
        });
    } else {
        res.status(401).send('Gecersiz imza.');
    }
});

app.listen(PORT, () => {
    console.log(`Webhook servisi ${PORT} portunda calisiyor...`);
});