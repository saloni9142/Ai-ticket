import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import userRoutes from "./routes/user.js";
import ticketRoutes from "./routes/ticket.js";
import { serve } from "inngest/express";



const PORT=process.env.PORT|| 3000
const app= express()
 app.use(cors())
 app.use(express.json());
 app.use("/api/auth",userRoutes)
 app.use("/api/tickets",ticketRoutes);
 app.use("/api/inngest",serve)

 mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("Mongodb Connected");
    app.listen(PORT,()=>console.log("server at http://localhost:3000"));

    
 })
 .catch((err)=> console.error("MongoDB error:", err));