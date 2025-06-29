export function saveReflection(reflection) {
    const saved = JSON.parse(localStorage.getItem('tetherReflections')) || [];
    saved.push({ reflection, date: new Date().toISOString() });
    localStorage.setItem('tetherReflections', JSON.stringify(saved));
  }
  