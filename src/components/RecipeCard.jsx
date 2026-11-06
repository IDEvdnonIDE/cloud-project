import { Link } from 'react-router-dom';
import Icon from './Icon';
import RecipeImage from './RecipeImage';
import SaveButton from './SaveButton';
import { formatTime } from '../utils/format';

/**
 * Portrait photo, title, cook time (design.md "Recipe card"). No card box: the photo is the card.
 * `linkable={false}` is used for the live preview in the recipe editor.
 */
export default function RecipeCard({ recipe, linkable = true }) {
  const title = recipe.title || 'Untitled recipe';

  return (
    <article className="position-relative h-100">
      <div className="position-relative">
        <RecipeImage recipe={recipe} ratio="portrait" size="display-3" className="rounded-2" />
        {linkable && <SaveButton recipe={recipe} overlay className="position-absolute top-0 end-0 m-2 z-2" />}
      </div>
      <h3 className="recipe-card-title line-clamp-2 mt-2 mb-1">
        {linkable ? (
          <Link to={`/recipes/${recipe.id}`} className="stretched-link text-reset">
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <div className="small text-body-secondary d-flex align-items-center gap-1">
        <Icon name="clock" size={14} />
        {formatTime(recipe.totalTime)}
      </div>
      {recipe.matchTotal > 0 && (
        <div className="small fw-semibold text-success mt-1">
          Uses {recipe.matched} of your {recipe.matchTotal} ingredient{recipe.matchTotal === 1 ? '' : 's'}
        </div>
      )}
    </article>
  );
}
