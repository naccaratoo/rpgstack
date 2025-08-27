const express = require('express');
const app = express();
const PORT = 3002;

app.get('/', (req, res) => {
    res.send('<h1>Servidor funcionando! 🎉</h1>');
});

app.listen(PORT, () => {
    console.log(`Servidor teste rodando em http://localhost:${PORT}`);
});