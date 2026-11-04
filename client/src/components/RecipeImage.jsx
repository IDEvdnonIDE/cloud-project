import { Ratio } from 'react-bootstrap';

/** Shows the uploaded photo, or a big emoji tile when a recipe has no photo. */
export default function RecipeImage({ recipe, className = '', size = 'display-1' }) {
  return (
    <Ratio aspectRatio="16x9" className={`overflow-hidden ${className}`}>
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.title} className="w-100 h-100 object-fit-cover" />
      ) : (
        <div className={`d-flex align-items-center justify-content-center bg-primary-subtle ${size}`} role="img" aria-label={recipe.title}>
          {recipe.emoji || '🍽️'}
        </div>
      )}
    </Ratio>
  );
}
