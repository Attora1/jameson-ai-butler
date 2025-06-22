import express from 'express';
const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/test', (req, res) => {
  console.log('TEST ROUTE TRIGGERED');
  res.send('ALIVE');
});

app.listen(3001, '0.0.0.0', () => console.log('Test Server Running'));
