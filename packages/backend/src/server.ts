// tslint:disable-next-line:no-var-requires
require("module-alias/register")

import dotenv from "dotenv"
import { Container } from "typedi"
import { App } from "./app"
import { Database } from "./config/database"

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env" })
}

const app = Container.get(App).getApp()
const database = Container.get(Database)
const port = process.env.PORT || 3000

database.connect() // hmm, this is async btw

/**
 * Start Express server.
 */

app.listen(port, () => {
  console.log(
    "  App is running at http://localhost:%d in %s mode",
    port,
    app.get("env"),
  )
  console.log("  Press CTRL-C to stop\n")
})
