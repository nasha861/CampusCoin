// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//     {
//         name: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         email: {
//             type: String,
//             required: true,
//             unique: true,
//             lowercase: true,
//             trim: true,
//         },
//         password: {
//             type: String,
//             required: true,
//             minlength: 6,
//         },
//         role: {
//             type: String,
//             enum: ["student", "admin"],
//             default: "student",
//         },
//         academicYear: {
//             type: String,
//             trim: true,
//         },
//         monthlyAllowance: {
//             type: Number,
//             min: 0,
//             default: 0,
//         },
//         savingsGoal: {
//             type: Number,
//             min: 0,
//             default: 0,
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// module.exports = mongoose.model("User", userSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
        type: String,
        enum: ['student', 'instructor', 'admin', 'management'],
        default: 'student',
    },
    address: { type: String },
    profilePic: { type: String }, // Url
    enrollmentDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
},
{ timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
