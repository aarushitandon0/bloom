// ── Calendar page — redirects to unified Insights ───────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Calendar() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/insights', { replace: true });
  }, [navigate]);

  return null;
}
