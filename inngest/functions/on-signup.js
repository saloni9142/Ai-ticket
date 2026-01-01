import User from "../../models/user"
import { NonRetriableError } from "inngest";
import { inngest } from "../client";

export const onUserSignup= inngest.createFunction(
    {id: "on-user-signup", retries:2},
    {event: "user/signup"},
    async({event, step})=>{
        try {
            const {email} = event.data
          const user=  await step.run("get-user-email", async()=>{
                const userObject= await UserActivation.findOne({email})
                if(!userObject){
                    throw new NonRetriableError("User no longer exists in our database")
                }
                return userObject
            })
            await step.run("send-welcome-email", async()=>{
                const subject =`welcome to the app`
                const message=`hi,
                \n\n
                thanks for siging up. We re glad to have you onboard!`
                await sendMail(user.email, subject, message)
            })
            return {success:true}
            
        } catch (error) {
            console.error("error running step", error.message)
            
        }

    })
