import Joi from "joi";

const schema = Joi.object({
    DATABASE_URL: Joi.string().required(),
    PORT: Joi.number().required(),
    NODE_ENV: Joi.string().required(),
    POSTGRES_USER: Joi.string().required(),
    POSTGRES_PASSWORD: Joi.string().required(),
    POSTGRES_DB: Joi.string().required(),
});

const { error, value } = schema.validate(process.env);

if (error) {
    throw new Error("Invalid environment variables");
}

export default {
    DATABASE_URL: value.DATABASE_URL,
    PORT: value.PORT,
    NODE_ENV: value.NODE_ENV,
    POSTGRES_USER: value.POSTGRES_USER,
    POSTGRES_PASSWORD: value.POSTGRES_PASSWORD,
    POSTGRES_DB: value.POSTGRES_DB,
};
