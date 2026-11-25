"use strict";

const app = require("./app");
const { connectDatabase, disconnectDatabase } = require("./config/database");

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("falta la variable de entorno JWT_SECRET");
        }

        // primero se abre la base de datos y después se aceptan peticiones
        await connectDatabase();

        const server = app.listen(PORT, () => {
            console.log("==========================================");
            console.log(" VITAMAPA API · red de atención médica");
            console.log("==========================================");
            console.log(` Servidor:   http://localhost:${PORT}`);
            console.log(` Health:     http://localhost:${PORT}/api/health`);
            console.log(` Ubicaciones http://localhost:${PORT}/api/locations`);
            console.log("==========================================");
        });

        function shutdown(signal) {
            console.log(`\nSe recibió ${signal}. Cerrando servidor...`);

            server.close(async () => {
                await disconnectDatabase();
                process.exit(0);
            });
        }

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error("Error al iniciar el servidor:", error.message);
        process.exit(1);
    }
}

startServer();
