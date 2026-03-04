import express, { type Request, type Response } from 'express'; 
import { PORT } from './config/constant';


// servives to be used in the app. 
export const app = express(); 



export function startServer() {
    app.listen(PORT, (error: any)=> {
        if(error) {
            console.log(error)
        }
    
        console.log(`Server is running on http://localhost:${PORT}`)
    })
}


app.get('/', (req: Request, res: Response) => {
    res.send('Hello World from the server')
})