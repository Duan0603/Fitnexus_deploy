import { useCallback, useState } from 'react';

export default function usePasswordVisibility(initial = false) {
  const [visible, setVisible] = useState(initial);
  const toggle = useCallback(() => setVisible((v) => !v), []);
  const type = visible ? 'text' : 'password';
  return { visible, type, toggle };
}

