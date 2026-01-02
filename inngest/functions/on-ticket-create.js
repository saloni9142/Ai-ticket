import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js"
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";



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
                
            })
            
        } catch (error) {
            
        }
    }

)