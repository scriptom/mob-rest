import express from 'express';
import routes from "./infrastructure/routes";
import path from "path";
import cors from 'cors';
const app = express();

const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;

app.use(cors({
    origin: '*'
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', routes());
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public/index.html'));
// });
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

export default app;