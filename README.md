# Culture Forward API

A NodeJS Express.js API for Culture Forward application.

## Get Started

- git clone https://github.com/MyUnfold/culture_forward_api.git
- cd culture_forward_api
- npm install
- npm run env:pull:development
- npm run dev (or npm start)


## Features

- ORM: Primsa
- Authentication: Bearer token or Session (cookie) JWT
- Environment variables: .env or dotenv-vault.org (recommended)
- Logging: Winston (console and file)
- Linting: ESLint
- Process Management: pm2 (not required to run)
- CI/CD: Github Actions
- API documentation: Swagger (password protected and disabled in production)
- Server features
    - Rate limiting
    - CORS
    - XSS protection
    - 10mb JSON body limit (configurable)
    - File uploading powered by Multur - default acceptable files: .jpg|.jpeg|.png|.gif|.heif|.heic|.tiff|.bmp|.mp4|.mov|.3gp|H.264|H.265|.pdf|.doc|.docx
    - Request and response timeouts: default - 30 seconds
    - Login rate limiting
    - SSL/TLS (disabled by default)

## Endpoints

Use the Swagger documentation

Visit Swagger: [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/)

***Note: Swagger endpoint will prompt you for a username and password in staging environment. You can find this login information in the .env file***

## Database Instance

### Hosted on MongoDB Atlas
**URL:** mongodb+srv://cultureforwardappuser:NTRcNxzK5ADkFuIU@getit-cluster0.avppzsc.mongodb.net/cultureforward?retryWrites=true&w=majority

***Note: IP Address must be whitelisted***

## Testing

There are a few unit tests written which can be ran using ```npm test```. For endpoint testing, please grab the [Postman](https://postman.com) collection files from the ```docs``` folder of this repo.

## Useful Links
* https://www.prisma.io/docs/concepts/components/prisma-client/crud
* https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
* https://www.redhat.com/en/topics/api/what-is-a-rest-api
* https://expressjs.com