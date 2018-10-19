const express = require('express')
const router = express.Router()
const User = require('../model/users');

const mongoose = require('mongoose')

// GET ALL USER
router.get('/', (req,res,next) => {
    User.find()
        .then(result => res.status(200).json(result))
        .catch( err => res.status(500).json(err))
})

// GET BY EMAIL
router.get('/:email', (req,res,next) => {
    User.findOne({email: req.params.email}, (err,result) => {
        if(err) return res.status(500).json(err)
        return res.status(200).json(result)
    })
})

router.put('/', (req,res,next) => {
    User.findOneAndUpdate({email: req.body.email}, req.body ,(err,result) => {
        if(err) return res.status(500).json(err)
        return res.status(200).json(result)
    })
})

// DELETE BY ID
router.delete('/:id', (req,res) => {
    User.findByIdAndRemove({_id: req.params.id}, (err,result) => {
        if(err) return res.status(500).json(err)
        else return res.status(200).json(result)
    })
})


module.exports = router
