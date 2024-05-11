const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express()

const corsOptions = {
    origin: [
        'http://localhost:5173',
    'http://localhost:5174',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json())



app.get('/', async(req, res)=>{
    res.send('Food Bridge is connected')
})

app.listen(port, ()=>{
    console.log('Food Bridge is running on port:', port)
})