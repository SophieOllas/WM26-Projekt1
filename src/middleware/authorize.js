const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({
                message: 'Unauthorized',
                error: 'Missing Authorization header'
            })
        }

        const token = authHeader.split(' ')[1]
        const user = jwt.verify(token, process.env.JWT_SECRET)

        req.authUser = user
        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            message: 'Unauthorized',
            error: error.message
        })
    }
}