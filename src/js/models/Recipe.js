import axios from 'axios';

export default class Recipe {
	constructor(id) {
		this.id = id;
	}

	async getRecipe() {
		try {
			const res = await axios(
				`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`
			);

			this.title = res.data.recipe.title;
			this.author = res.data.recipe.publisher;
			this.img = res.data.recipe.image_url;
			this.url = res.data.recipe.source_url;
			this.ingredients = res.data.recipe.ingredients;
		} catch (error) {
			console.log(error);
			alert('Something went wrong!');
		}
	}

	calcTime() {
		// assumes we need 15 mins
		// for each group of 3 ingredients
		const numIng = this.ingredients.length;
		const periods = Math.ceil(numIng / 3);
		this.time = periods * 15;
	}

	calcServings() {
		this.servings = 4;
	}

	parseIngredients() {
		const unitsLong = [
			'tablespoons',
			'tablespoon',
			'ounces',
			'ounce',
			'teaspoons',
			'teaspoon',
			'cups',
			'pounds',
		];
		const unitsShort = [
			'tbsp',
			'tbsp',
			'oz',
			'oz',
			'tsp',
			'tsp',
			'cup',
			'pound',
		];
		const units = [...unitsShort, 'kg', 'g'];

		const newIngredients = this.ingredients.map(el => {
			// 1 - uniform units
			let ingredient = el.toLowerCase();
			unitsLong.forEach((unit, i) => {
				ingredient = ingredient.replace(unit, unitsShort[i]);
			});

			// 2 - remove brackets
			ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ');

			// 3 - parse ingredients into cound, unit and ingredient
			const arrIng = ingredient.split(' ');
			const unitIdx = arrIng.findIndex(el2 => units.includes(el2));

			let objIng;
			if (unitIdx > -1) {
				// there is a unit

				// i.e. 4 1/2	 -> arrCount=[4, 1/2]
				// i.e. 4		 -> arrCount=[4]
				const arrCount = arrIng.slice(0, unitIdx);

				let count;
				if (arrCount.length === 1) {
					// i.e. "1-1/2" -> "1+1/2" -> eval("1+1/2") -> 1.5
					count = eval(arrIng[0].replace('-', '+'));
				} else {
					// i.e. ["4","1/2"] -> "4+1/2" 	-> eval("4+1/2") -> 4.5
					count = eval(arrIng.slice(0, unitIdx).join('+'));
				}

				objIng = {
					count,
					unit: arrIng[unitIdx],
					ingredient: arrIng.slice(unitIdx + 1).join(' '),
				};
			} else if (parseInt(arrIng[0], 10)) {
				// there is NO unit, but the first element is a num
				objIng = {
					count: parseInt(arrIng[0], 10),
					unit: '',
					ingredient: arrIng.slice(1).join(' '),
				};
			} else if (unitIdx === -1) {
				// there is NO unit AND first element is NOT a num
				objIng = {
					count: 1,
					unit: '',
					ingredient,
				};
			}

			return objIng;
		});

		this.ingredients = newIngredients;
	}

	updateServings(type) {
		// Servings
		const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;

		// Ingredients
		this.ingredients.forEach(ing => {
			ing.count *= newServings / this.servings;
		});

		this.servings = newServings;
	}
}
