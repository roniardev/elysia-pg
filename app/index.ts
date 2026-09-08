import { config } from "@/app/config"
import {
    closeApplicationResources,
    initializeApplicationResources,
} from "@/app/runtime"
import { app } from "@/app/server"
import logger from "@/utils/logger"

const signals = ["SIGINT", "SIGTERM"]
let shuttingDown = false

await initializeApplicationResources()

for (const signal of signals) {
    process.on(signal, async () => {
        if (shuttingDown) {
            return
        }

        shuttingDown = true
        logger.info({
            event: "application_shutdown",
            signal,
            outcome: "started",
        })
        await app.stop()
        await closeApplicationResources()
        process.exit(0)
    })
}

process.on("uncaughtException", (error) => {
    logger.error({
        event: "application_failure",
        outcome: "uncaught_exception",
        error,
    })
})

process.on("unhandledRejection", (error) => {
    logger.error({
        event: "application_failure",
        outcome: "unhandled_rejection",
        error,
    })
})

app.listen(config.PORT, () => {
    logger.info({
        event: "application_started",
        address: app.server?.url.origin,
        port: config.PORT,
    })
})
