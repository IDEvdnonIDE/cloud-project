import express from "express";
import recipeRoutes from "./recipeRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json());

app.use("/api/v1/recipes", recipeRoutes)

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})
