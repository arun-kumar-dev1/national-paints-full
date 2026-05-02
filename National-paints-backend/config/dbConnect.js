// const mongoose = require('mongoose')

// const dbConnect = () => {
//     try{
//         mongoose.connect(process.env.MONGODB_URL)
//         console.log('database connected')

//     }catch(err){
//         console.log(err)
//     }
// } 

// module.exports = dbConnect




const mongoose = require("mongoose");

const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`✅ Database connected: ${conn.connection.host}`);
    } catch (err) {
        console.log("❌ DB Error:", err.message);
        process.exit(1);
    }
};

module.exports = dbConnect;