const jwt = require('jsonwebtoken')

module.exports = AuthChecker = (req,res,next) => {
    const header = req.headers['authorization']

    if(typeof header !== 'undefined') {
        const token = header.split(' ')[1]
        if(header.split(' ')[0] !== 'Bearer') return res.status(401).json({error : "ERROR"})
        jwt.verify(token, 'secret_key', (err,decoded) => {
            if(err) {
                return res.status(401).json(err)
            } else {
                req.decoded = decoded
                next();
            }
        })
    } else {
        res.status(403).json({
            message: "You don't have permission."
        })
    }
} 