import { Request, Response, NextFunction } from 'express';

const parseFormData = (req: Request, res: Response, next: NextFunction) => {
    // If 'data' is given, parse it
    if (req.body && req.body.data) {
        try {
            req.body = JSON.parse(req.body.data);
            return next();
        } catch (e) {
            console.error("Invalid JSON inside data field:", (e as Error).message);
            // Optionally could throw error here if strict
        }
    }

    // Alternatively, some users might stringify individual nested objects, 
    // or we might need to cast numeric strings to numbers for Zod before validation.
    // Zod's `coerce.number()` handles string to number conversion for us.
    
    // Just for debugging the Postman issue, log what came in
    console.log("Raw req.body before validation:", req.body);
    console.log("Files:", req.files, req.file);

    next();
};

export default parseFormData;
