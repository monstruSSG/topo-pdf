const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))


app.use(express.static(path.join(__dirname, 'public')))
app.all(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`)
})

