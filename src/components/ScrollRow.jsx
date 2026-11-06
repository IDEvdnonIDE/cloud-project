import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import RecipeCard from './RecipeCard';
import { SkeletonCard } from './RecipeGrid';

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A titled, horizontally scrolling row of recipe cards (design.md "Recipe card" rows):
 * title on the left, "View all" and prev/next buttons on the right.
 */
export default function ScrollRow({ id, title, subtitle, to, recipes = [], loading = false, empty }) {
  const track = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, recipes.length, loading]);

  const scroll = (dir) => {
    const el = track.current;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const headingId = `${id}-title`;
  const showArrows = !loading && recipes.length > 0;

  return (
    <section className="mb-6" aria-labelledby={headingId}>
      <div className="d-flex justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h2 id={headingId} className="h4 mb-0">
            {title}
          </h2>
          {subtitle && <p className="text-body-secondary mb-0">{subtitle}</p>}
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to={to} className="fw-semibold text-reset text-nowrap me-2 d-inline-flex align-items-center gap-1">
            View all <Icon name="chevron-right" size={14} />
          </Link>
          {showArrows && (
            <>
              <Button variant="outline-secondary" className="btn-icon" onClick={() => scroll(-1)} disabled={edges.start} aria-label={`Scroll ${title} back`}>
                <Icon name="chevron-left" />
              </Button>
              <Button variant="outline-secondary" className="btn-icon" onClick={() => scroll(1)} disabled={edges.end} aria-label={`Scroll ${title} forward`}>
                <Icon name="chevron-right" />
              </Button>
            </>
          )}
        </div>
      </div>

      {!loading && recipes.length === 0 ? (
        <p className="text-body-secondary">{empty}</p>
      ) : (
        <div ref={track} className="scroll-row" onScroll={measure} tabIndex={0} role="region" aria-labelledby={headingId}>
          {loading
            ? Array.from({ length: 5 }, (_, n) => <SkeletonCard key={n} />)
            : recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      )}
    </section>
  );
}
