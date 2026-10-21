import { useCallback, useEffect, useState } from 'react';
import { recipeApi } from '../utils/api';

/**
 * Loads published (ACTIVE) recipes straight from the backend so the storefront
 * always reflects what admins have saved — never a stale browser cache.
 * Refreshes when the tab regains focus.
 */
export default function usePublicRecipes() {
  const [recipes, setRecipes] = useState(null); // null = not loaded yet
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await recipeApi.getRecipes();
      const list = Array.isArray(res?.data?.recipes) ? res.data.recipes : [];
      setRecipes(list.map((r) => ({ ...r, id: String(r._id || r.id) })));
      setError(null);
    } catch (err) {
      console.warn('[usePublicRecipes] Could not load recipes:', err.message);
      setError(err);
    }
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [load]);

  return { recipes: recipes || [], loading: recipes === null && !error, error };
}
