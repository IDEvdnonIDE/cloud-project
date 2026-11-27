let URL = "https://recipeapi.io/api/v1/recipes?"

export async function getExRecipes(filters) {
    const filteredQuery = [];
    let idx = 0;

    console.log("These are the filters")
    console.log(filters)
    if (filters.q) filteredQuery[idx++] = `search=${filters.q}`;
    if (filters.ingredients.length) filteredQuery[idx++]=`ingredients=${filters.ingredients.join(',')}`; // check whether ingredients
    // if (filters.maxTime) filteredQuery[idx++] = `maxTime=${filters.maxTime}`; // Cannot do filter since 3rd API is together
    if (filters.difficulty) filteredQuery[idx++]=`difficulty=${filters.difficulty}`;
    if (filters.cuisine) filteredQuery[idx++]=`cuisine=${filters.cuisine}`;
    if (filters.mealType) filteredQuery[idx++]=`meal_type=${filters.mealType}`;
    if (filters.diets.length) filteredQuery[idx++]=`dietary_tags=${filters.diets[0]}`; // multiple diary tags not supported, so after fetching

    const query = URL + filteredQuery.join('&');

    console.log(filteredQuery);
    console.log(query);

    try {
        const response = await fetch(
            query,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.RECIPEAPI_KEY}`,
                }
            }
        );
    } catch (error) {}


}
