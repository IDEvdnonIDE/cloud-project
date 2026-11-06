import { Ratio } from 'react-bootstrap';

/** Ratio presets. Bootstrap's Ratio takes a number as height/width in percent. */
const RATIOS = { portrait: 133.333, wide: '16x9' };

/**
 * Shows the uploaded photo, or a big emoji tile when a recipe has no photo.
 * `priority` is for the one above-the-fold photo on a page (the recipe detail header).
 */
export default function RecipeImage({ recipe, className = '', size = 'display-1', ratio = 'wide', priority = false }) {
  return (
    <Ratio aspectRatio={RATIOS[ratio] ?? ratio} className={`overflow-hidden ${className}`}>
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.title} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} className="w-100 h-100 object-fit-cover" />
      ) : (
        <div className={`d-flex align-items-center justify-content-center bg-primary-subtle ${size}`} role="img" aria-label={recipe.title}>
          {recipe.emoji || '🍽️'}
        </div>
      )}
    </Ratio>
  );
}
