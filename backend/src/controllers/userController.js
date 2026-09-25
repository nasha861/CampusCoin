const User = require("../models/User");

// Test controller

const testUserController = async (req, res) => {

    try{
        res.status(200).json({
            message: "User controller is working",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error occurred while testing user controller",
            error: error.message,
        });
    }
};

module.exports = { testUserController };