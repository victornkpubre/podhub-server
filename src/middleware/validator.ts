import * as yup from "yup"
import { RequestHandler } from "express";

export const validate = (schema: any): RequestHandler => {
    return async (req, res, next) => {
        console.log(req.body)
        if(!req.body) return res.status(422).json({error: "Empty body is not excepted!"})
       
        const schemaToValidate = yup.object({
            body: schema,
        });
        

        try {
            await schemaToValidate.validate({
                body: req.body
            }, {
                abortEarly: true
            });

            next();
        } catch (error) {
            if(error instanceof yup.ValidationError) {
                res.status(422).json({error: error.message})
            }
        }
    }
}