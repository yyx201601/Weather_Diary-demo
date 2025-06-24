const express = require('express');
const axios = require('axios');
const router = express.Router();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.weatherapi.com/v1/current.json';

router.get('/', async (req, res) => {
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: 'City parameter is required' });
    }

    try {
        const response = await axios.get('https://api.weatherapi.com/v1/current.json', {
            params: {
                key: process.env.WEATHER_API_KEY,
                q: city,
                aqi: 'no'
            }
        });

        const data = response.data;

        const result = {
            location: `${data.location.name}, ${data.location.country}`,
            region: data.location.region,
            temperature: `${data.current.temp_c}°C`,
            feels_like: `${data.current.feelslike_c}°C`,
            condition: data.current.condition.text,
            humidity: `${data.current.humidity}%`,
            wind: `${data.current.wind_kph} km/h ${data.current.wind_dir}`,
            pressure: `${data.current.pressure_mb} mb`,
            visibility: `${data.current.vis_km} km`,
            uv_index: data.current.uv,
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});


module.exports = router;
