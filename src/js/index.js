// url : forkify-api.herokuapp.com
// search: const res = await axios(`https://forkify-api.herokupapp.com/api/search?key=${KEY}&q=${this.query}`);
// recipe: const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';

import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import { elements, renderLoader, clearLoader } from './views/base';

/* Global State:
 *  - Search object
 *  - Current recipe object
 *  - Shopping list object
 *  - Liked recipes
 */

const state = {};

///------------------- SEARCH CONTROLLER---------------------///
const controlSearch = async () => {
	// 1 - get query from view
	const query = searchView.getInput();

	if (query) {
		//2 - new search object and add to state
		state.search = new Search(query);
		//3 - prepare ui for result
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);
		try {
			//4 - search for recipes
			await state.search.getResults();
			//5 - render results on ui
			searchView.renderResults(state.search.result);
		} catch (error) {
			alert('Something went wrong with the search...');
		}

		clearLoader();
	}
};

elements.searchForm.addEventListener('submit', e => {
	e.preventDefault();
	controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline');
	if (btn) {
		const goToPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.renderResults(state.search.result, goToPage);
	}
});

///------------------- RECIPE CONTROLLER---------------------///
const controlRecipe = async () => {
	// get recipe ID from url
	const id = window.location.hash.replace('#', '');

	if (id) {
		// 1 - prepare UI from changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		// 2 - hightlight seelcted search item
		if (state.search) searchView.highlightSelected(id);

		// 3 - create new recipe object
		state.recipe = new Recipe(id);

		try {
			// 4 - get recipe data AND parse data
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();

			// 5 - calculate serving size and prep time
			state.recipe.calcTime();
			state.recipe.calcServings();

			// 6 - render recipe
			clearLoader();
			recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
		} catch (error) {
			alert('Error processing recipe!');
		}
	}
};

///---------------- SHOPPING LIST CONTROLLER---------------------///
const controlList = () => {
	// 1 - if NO existing list, create new list
	if (!state.list) state.list = new List();

	// 2 - add each ingredient to list and UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
};

// handle item removal and update items in list
elements.shopping.addEventListener('click', e => {
	// 1 - retrieve id of item
	const id = e.target.closest('.shopping__item').dataset.itemid;

	// 2 - handle delete button
	if (e.target.matches('.shopping__delete, .shopping__delete *')) {
		// 2a - delete from global state
		state.list.deleteItem(id);

		// 2b - delete from UI
		listView.deleteItem(id);
	} else if (e.target.matches('.shopping__count-value')) {
		// 3 - handle ingredient count inc or dec

		// 3a read data from UI
		const val = parseFloat(e.target.value, 10);
		// 3b - update global state
		state.list.updateCount(id, val);
	}
});

///------------------- LIKES CONTROLLER---------------------///

const controlLike = () => {
	if (!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;

	// User has NOT yet liked current recipe
	if (!state.likes.isLiked(currentID)) {
		// Add like to the state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
		);
		// Toggle the like button
		likesView.toggleLikeBtn(true);

		// Add like to UI list
		likesView.renderLike(newLike);

		// User HAS liked current recipe
	} else {
		// Remove like from the state
		state.likes.deleteLike(currentID);

		// Toggle the like button
		likesView.toggleLikeBtn(false);

		// Remove like from UI list
		likesView.deleteLike(currentID);
	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//***************************** EVENT LISTENERS ******************************/
['hashchange', 'load'].forEach(event =>
	window.addEventListener(event, controlRecipe)
);

// restore liked recipes on load
window.addEventListener('load', () => {
	state.likes = new Likes();

	// Restore likes
	state.likes.readStorage();

	// Toggle like menu button
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	// Render the existing likes
	state.likes.likes.forEach(like => likesView.renderLike(like));
});

// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
	if (e.target.matches('.btn-decrease, .btn-decrease *')) {
		// decrease clicked
		if (state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsUI(state.recipe);
		}
	} else if (e.target.matches('.btn-increase, .btn-increase *')) {
		// increase clicked
		state.recipe.updateServings('inc');
		recipeView.updateServingsUI(state.recipe);
	} else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
		// add ingredients to shopping list
		controlList();
	} else if (e.target.matches('.recipe__love, .recipe__love *')) {
		// likes controller
		controlLike();
	}
});
