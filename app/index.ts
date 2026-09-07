import { config } from "@/app/config"
import {
    closeApplicationResources,
    initializeApplicationResources,
} from "@/app/runtime"
import { app } from "@/app/server"

const signals = ["SIGINT", "SIGTERM"]
let shuttingDown = false

await initializeApplicationResources()

for (const signal of signals) {
    process.on(signal, async () => {
        if (shuttingDown) {
            return
        }

        shuttingDown = true
        console.log(`Received ${signal}. Initiating graceful shutdown...`)
        await app.stop()
        await closeApplicationResources()
        process.exit(0)
    })
}

process.on("uncaughtException", (error) => {
    console.error(error)
})

process.on("unhandledRejection", (error) => {
    console.error(error)
})

app.listen(config.PORT, () =>
    console.log(`🦊 Server started at ${app.server?.url.origin}`),
)
