import express from 'express';
import { getExRecipes } from "./recipeService.js";


const router = express.Router();

router.get("/", async (req, res) => {
    res.send("hola from backend")

    // try {
    //     const recipes = await getExRecipes(req.body)
    //
    //     res.json(recipes);
    // } catch (error) {
    //     console.log(error);
    //
    //     res.status(502).json({
    //         error: 'Failed to get recipes'
    //     });
    // }
})

export default router