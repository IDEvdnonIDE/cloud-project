import { Badge, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import RecipeImage from './RecipeImage';
import { difficultyBadge, formatTime, truncate } from '../utils/format';

/** `linkable={false}` is used for the live preview in the recipe editor. */
export default function RecipeCard({ recipe, linkable = true }) {
  const title = linkable ? (
    <Link to={`/recipes/${recipe.id}`} className="stretched-link text-reset text-decoration-none">
      {recipe.title}
    </Link>
  ) : (
    recipe.title || 'Untitled recipe'
  );

  return (
    <Card className="h-100 shadow-sm">
      <RecipeImage recipe={recipe} className="card-img-top" />
      <Card.Body className="d-flex flex-column">
        <div className="d-flex flex-wrap gap-1 mb-2">
          <Badge bg="light" text="dark">⏱ {formatTime(recipe.totalTime)}</Badge>
          <Badge {...difficultyBadge(recipe.difficulty)}>{recipe.difficulty}</Badge>
          {recipe.cuisine && <Badge bg="light" text="dark">{recipe.cuisine}</Badge>}
        </div>
        <Card.Title as="h3" className="h5 mb-1">{title}</Card.Title>
        <Card.Text className="small text-body-secondary flex-grow-1">{truncate(recipe.description, 95)}</Card.Text>
        {recipe.matchTotal > 0 && (
          <div className="small fw-semibold text-success">
            ✓ Uses {recipe.matched} of your {recipe.matchTotal} ingredient{recipe.matchTotal === 1 ? '' : 's'}
          </div>
        )}
      </Card.Body>
      <Card.Footer className="d-flex justify-content-between align-items-center small text-body-secondary">
        {linkable ? (
          <Link to={`/chefs/${recipe.author.id}`} className="position-relative z-2 text-reset">
            {recipe.author.avatar} {recipe.author.name}
          </Link>
        ) : (
          <span>
            {recipe.author.avatar} {recipe.author.name}
          </span>
        )}
        <span>
          👍 {recipe.ups} · 💬 {recipe.commentCount}
        </span>
      </Card.Footer>
    </Card>
  );
}
