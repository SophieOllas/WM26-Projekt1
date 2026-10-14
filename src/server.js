const express = require('express')
require('dotenv').config()
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 8080

console.log(`Node.js ${process.version}`)

app.use(express.json())

app.use(cors({
  origin: ['https://people.arcada.fi']
}));

app.get('/', (req, res) => {
    res.json({ msg: 'Notes API' })
})

const notesRouter = require('./routes/notes')
app.use('/notes', notesRouter)

app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`)
})
