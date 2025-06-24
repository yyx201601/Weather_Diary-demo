const express = require('express');
const dotenv = require('dotenv');
const weatherRouter = require('./routes/weather');
const authRoutes = require('./routes/auth');
const setLanguageRoute = require('./routes/set-language');
const diaryRoutes = require('./routes/diary'); // 新增日记路由

dotenv.config();

const app = express();
const PORT = 8080;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use('/api/weather', weatherRouter);
app.use('/api/auth', authRoutes);
app.use('/api/set-language', setLanguageRoute);
app.use('/api/diary', diaryRoutes); // 新增日记API路由

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});