import swaggerAutogen from 'swagger-autogen';
import fs from 'fs';

const doc = {
  info: {
    title: 'BrownMd API',
    description: 'API Documentation for BrownMd Backend'
  },
  host: 'localhost:5000',
  basePath: '/api/v1',
  schemes: ['http', 'https'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: "Enter your bearer token in the format 'Bearer <token>'"
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  definitions: {
    Login: {
      email: "user@example.com",
      password: "password123"
    },
    Register: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
      phone: "017XXXXXXXX",
      street: "Main Street",
      location: "City Name",
      postalCode: "1234"
    },
    CreateReview: {
      reviewType: "equipment",
      equipment: "60d5ecb8b3928400158a5a41",
      order: "60d5ecb8b3928400158a5a42",
      rating: 5,
      comment: "Excellent service!"
    },
    UpdateProfileBase: {
      firstName: "John",
      lastName: "Doe",
      phone: "017XXXXXXXX",
      street: "Main Street",
      location: "City Name",
      postalCode: "1234"
    }
  }
};

// Guarantee we always target the exact same file in src directory
const outputFile = './src/swagger.json';

// Pointing directly to the explicitly declared routes in router/index.ts
// allows swagger-autogen to perfectly resolve paths like /auth/login and /user/all-users
// combined with the basePath of /api/v1.
const endpointsFiles = ['./src/router/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  // Post-processing to automatically provide Folder/Route-wise grouping (Tags)
  const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  
  for (const path in data.paths) {
    // Extract the base folder from the path (e.g., /auth/login -> auth)
    const tag = path.split('/')[1]; 
    if (!tag) continue;
    
    // Capitalize the tag (e.g., auth -> Auth)
    const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1);
    
    const methods = data.paths[path];
    for (const method in methods) {
      methods[method].tags = [capitalizedTag];
    }
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log("Swagger UI Tags perfectly generated.");
});
