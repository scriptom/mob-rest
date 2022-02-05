import express from 'express';
import routes from "./infrastructure/routes";
const app = express();

const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;

app.use('/api', routes());
app.get('/example', (req, res) => res.send('hello World'));
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(app._router.stack);
});

export default app;