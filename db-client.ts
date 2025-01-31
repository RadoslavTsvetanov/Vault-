import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";
import { Errorable } from "./utils/types/errorable";
import * as crypto from 'crypto';
import { ConcreteSafeType } from "./utils/types/ContextSafeType";
import { envManager } from "./env";

dotenv.config();

const uri = envManager.get("MONGO_URI") 
const dbName = "myDatabase";

const client = new MongoClient(uri);

interface TokenSchema {
    token: string;
    tokenName: string;
    iv: string;
    tag: string;
}

const algorithm = 'aes-256-gcm';



export class IVString extends ConcreteSafeType<string>{
    constructor(v: string) {
        super(v,
             (v) => {
                return v.length === 16 
            }
        ); 
    }
}

export class keyString extends ConcreteSafeType<string>{
    constructor(v: string) {
        super(v,
             (v) => {
                return v.length === 32 
            }
        );
    }
}

export class Encryptor {
    private key: Buffer;
    private iv: Buffer;

    constructor(keyString: keyString, ivString: IVString) {

        this.key = Buffer.from(keyString.getV(), 'utf8');
        this.iv = Buffer.from(ivString.getV(), 'utf8');
    }

    encrypt(text: string) {
        const cipher = crypto.createCipheriv(algorithm, this.key, this.iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag().toString('hex');

        return { encrypted, iv: this.iv.toString('hex'), tag };
    }

    decrypt(encrypted: string, iv: string, tag: string) {
        const decipher = crypto.createDecipheriv(algorithm, this.key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}

export class TokenRepo {
    private collectionName: string;
    private encryptor: Encryptor;

    constructor(collectionName: string, encryptor: Encryptor) { 
        this.collectionName = collectionName;
        this.encryptor = encryptor;
    }

    private async getDatabase(): Promise<{ db: Db; collection: Collection<TokenSchema> }> {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection<TokenSchema>(this.collectionName);
        return { db, collection };
    }

    public async tokenExists(token: string): Promise<boolean> {
        const { collection } = await this.getDatabase();
        const  hashed = this.encryptor.encrypt(token);
        console.log(hashed);
        const result = await collection.findOne({ token: hashed.encrypted });
        return result !== null;
    }

    public async createToken(tokenName: string, tokenValue: string): Promise<Errorable<string>> {
        const { collection } = await this.getDatabase();

        const encryptedToken = this.encryptor.encrypt(tokenValue);

        await collection.insertOne({
            token: encryptedToken.encrypted,
            tokenName: tokenName,
            iv: encryptedToken.iv,
            tag: encryptedToken.tag
        });

        return new Errorable(null, encryptedToken.encrypted);
    }

    public async getToken(tokenName: string): Promise<Errorable<string>> {
        const { collection } = await this.getDatabase();
        const result = await collection.findOne({ tokenName });

        if (!result) {
            return new Errorable<string>(null, "");
        }

        try {
            const decryptedToken = this.encryptor.decrypt(result.token, result.iv, result.tag);
            return new Errorable(null, decryptedToken);
        } catch (error) {
            return new Errorable<string>("Decryption failed", null);
        }
    }

    public async getTokens(): Promise<TokenSchema[]> {
        const { collection } = await this.getDatabase();
        return await collection.find().toArray();
    }
}

const key = "this_is_my_secret_key_32_chars!"; 
const iv = "this_is_my_iv_16"; 