import cookieParser from 'cookie-parser';
import express, { Application } from 'express';
import globalErrorHandler from './middleware/globalErrorHandler';
import notFound from './middleware/notFound';
import { applySecurity } from './middleware/security';
import router from './router';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';


const app: Application = express();

app.use(express.static('public'));

// ← REMOVE these from here, they're already in applySecurity
// app.use(express.json());  
// app.use(cookieParser());

applySecurity(app);

app.use(cookieParser());  // ← keep only cookieParser here


app.use('/api/v1', router);

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// app.use('/api/v1', router);

app.get('/', (_req, res) => {
  res.send('Hey there! Welcome to our Rental Equipment API.');
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;