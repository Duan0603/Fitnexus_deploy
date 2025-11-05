import { Sequelize } from "sequelize";
import config from "./config.js";

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];


export const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connection has been established successfully.');
    } catch( error ) {
        console.error(' Unable to connect to the database:', error);
        process.exit(1); 
    }
}