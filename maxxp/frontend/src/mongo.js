const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://MaxxEnergy:Maxxenergy@maxxenergy.jy0mw.mongodb.net/Maxxenergy?retryWrites=true&w=majority")
    .then(() => {
        console.log('mongoose connected');
    })
    .catch((e) => {
        console.error('MongoDB connection failed:', e);
    });

const logInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const LogInCollection = new mongoose.model('LogInCollection', logInSchema);

module.exports = LogInCollection;
