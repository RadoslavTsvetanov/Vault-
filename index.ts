import express from 'express';
import bcrypt from 'bcrypt';
import { Encryptor, IVString, keyString, TokenRepo } from './db-client';
import { handleError, handleUnauthenticatedError, sendSuccessfulResponse, ErrorResponse } from './utils/response-handlers';
import { handleErrorable, handleErrorableWithDefaults } from './errorableHandler';
import { randomUUID } from 'crypto';
import bodyParser from 'body-parser';
import { envManager } from './env';




const app = express();

app.use(bodyParser.json());
const secretsRouter = express.Router();



const secretsRepo = new TokenRepo(
    "secrets",
    new Encryptor(
    await handleErrorableWithDefaults(new keyString(envManager.get("ADMIN_COLLECTION_KEYSTRING_FOR_AES_WHICH_HAS_TO_BE_32_BYTES")).build()),
    await handleErrorableWithDefaults(new IVString(envManager.get("ADMIN_IV_STRING_16_BYTES")).build())
    )
)

const adminTokensRepo = new TokenRepo(
    "adminTokens",
    new Encryptor(
        await handleErrorableWithDefaults(new keyString(envManager.get("SECRETS_KEYSTRING")).build()),
        await handleErrorableWithDefaults(new IVString(envManager.get("SECRETS_IV_STRING")).build())
    )
)


secretsRouter.get("/:name", async (req: express.Request<{ name: string }, {}, {}>, res: express.Response<{value: string}>) => { 
    const { name } = req.params
    const r = await secretsRepo.getToken(name)
    handleErrorable(r,
        async () => {
            
            sendSuccessfulResponse(res, {value: r.value!})
        },
        async () => {
            console.log("tiri")
            handleError(res, {statusCode: 500, error: r.err!})
        }
    )
})

const adminRouter = express.Router();

adminRouter.post("/tokens", async (req: express.Request<{}, {}, {tokenName: string, value: string}>, res: express.Response) => {
    const {tokenName, value} = req.body


    const [tokenExists,f] = await handleErrorable(await secretsRepo.getToken(tokenName),
        async (token) => {
            if (token === "") {
                return false
            }
            return true
        },
        async (e) => {
            handleError(res, { statusCode: 500, error: e })
            throw new Error()
        }
    )

    if (tokenExists) {
        res.status(500).json({error: "tokenAlreadyExists"})
        return 
    }


    const r = await secretsRepo.createToken(tokenName,value)
    handleErrorable(r,
        async () => {
            sendSuccessfulResponse(res)
        },

        async () => {
            handleError(res, {statusCode: 500, error: r.err!})
        }
    )
    
    sendSuccessfulResponse(res)
})

adminRouter.post("/clients", async (req: express.Request<{}, {}, { value: string }>, res: express.Response) => { 
    const { value } = req.body
    const r = await adminTokensRepo.createToken(randomUUID().toString(),value)
    handleErrorable(r,
        async (v) => {
            sendSuccessfulResponse(res)
        },
        async () => {
            handleError(res, {statusCode: 500, error: r.err!})
        }
    )
}) 

app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    const  verificationToken = req.headers.authorization?.slice("Bearer".length+1);
    console.log(verificationToken)
    
    if (verificationToken === null || verificationToken === undefined) {
        handleUnauthenticatedError(res)
        return
    }
    
    if (await adminTokensRepo.tokenExists(verificationToken)) {
        next() 
        return
    }

    handleUnauthenticatedError(res)

})

app.use("/secrets", secretsRouter)
app.use("/admin", adminRouter)


if ((await handleErrorableWithDefaults(await adminTokensRepo.getToken("admin"))) === "") {
    const adminToken = "adminadmin" 
    await adminTokensRepo.createToken("admin", adminToken)
    console.log(`Generated admin token: ${adminToken}`)
}

app.listen(3000, () => {
    console.log("Server running on port 3000");
})