import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js"
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import ticket from "../../models/ticket.js";
import analyzeTicket from "../../utils/ai.js";
import { err } from "inngest/types";



export const onTicketCreated = inngest.createFunction(
    {id: "on-ticket-ceated", retries: 2},
    {events :"ticket/created"},
    async({event, step})=>{
        try {
            const {tickeId} = event.data

            // fetch ticket from db
         const ticketObject =   await step.run("fetch-ticket", async()=>{
                const ticket = await Ticket.findById(tickeId);
            if(!ticket){
                throw new NonRetriableError("Ticket not found");
            }
            return ticketObject
            })
            await step.run("update-ticket-status", async()=>{
                await Ticket.findByIdAndUpdate(ticket._id, {
                    status: "TODO"
                })

            const aiResponse=await analyzeTicket(ticket)
          const relatedSkills=  await step.run("ai-processing", async ()=>{
                let skills =[]
                if(aiResponse){
                    await Ticket.findByIdAndUpdate(ticket._id,{
                        priority: !["low", "medium", "high"].includes(aiResponse.priority) ? "medium" :
                         aiResponse.priority,
                         helpfulNotes : aiResponse.helpfulNotes,
                         status: "IN_PROGRESS",
                         relatedSkills: aiResponse.relatedSkills

        })

        skills = aiResponse.relatedSkills
                }
                return skills

            })
                
            })

            const moderator = await step.run("assign-moderator", async()=>{
                let user= await User.findOne({
                    role:" moderator",
                    skills:{
                        $elemMatch:{
                            $regex: relatedSkills.join("|"),
                            $options:"i",
                        },
                    },
                });

                if(!user){
                    user = await User.findOne({role: "admin"})
                }

                await Ticket.findByIdAndUpdate(ticket._id,{
                    assignedTo : user?._id || null,
                })
                return user
            });
            await step.run("send-notification", async()=>{
                if(moderator){

                    const finalTicket = await Ticket.findById(ticket._id);
                    await sendMail(
                        moderator.email,
                        "Ticket Assigned",
                        `A new ticket is assigned to you ${finalTicket.title}`
,                    )
                }
            })
            return {success: true}

        } catch (error) {
            console.error("error running steps", err.message);
             return {success: false}
            
        }
    }

)