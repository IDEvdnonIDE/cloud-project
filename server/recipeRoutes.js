import express from 'express';
import {getExRecipes} from "./recipeService";

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const recipes = await getExRecipes(req.body);

        res.json(recipes);
    } catch (error) {
        console.log(error);

        res.status(502).json({
            error: 'Failed to get recipes'
        });
    }
})