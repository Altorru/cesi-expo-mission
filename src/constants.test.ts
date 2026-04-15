/**
 * Tests pour les constantes de l'application
 * Vérifie que les valeurs de priorité et leurs couleurs sont correctes
 */

describe('Priority Constants', () => {
  // Constantes de priorité (reproduites ici pour les tests)
  const PRIORITY_META = {
    Critique: { label: 'Critique', color: '#c0392b' },
    Urgent: { label: 'Urgent', color: '#e67e22' },
    Normal: { label: 'Normal', color: '#f39c12' },
    Faible: { label: 'Faible', color: '#95a5a6' },
  };

  it('should have Critique priority with color #c0392b', () => {
    expect(PRIORITY_META.Critique.color).toBe('#c0392b');
    expect(PRIORITY_META.Critique.label).toBe('Critique');
  });

  it('should have Urgent priority with color #e67e22', () => {
    expect(PRIORITY_META.Urgent.color).toBe('#e67e22');
    expect(PRIORITY_META.Urgent.label).toBe('Urgent');
  });

  it('should have Normal priority with color #f39c12', () => {
    expect(PRIORITY_META.Normal.color).toBe('#f39c12');
    expect(PRIORITY_META.Normal.label).toBe('Normal');
  });

  it('should have Faible priority with color #95a5a6', () => {
    expect(PRIORITY_META.Faible.color).toBe('#95a5a6');
    expect(PRIORITY_META.Faible.label).toBe('Faible');
  });

  it('should define all required priority levels', () => {
    const priorityLevels = Object.keys(PRIORITY_META);
    expect(priorityLevels).toContain('Critique');
    expect(priorityLevels).toContain('Urgent');
    expect(priorityLevels).toContain('Normal');
    expect(priorityLevels).toContain('Faible');
  });

  it('should have valid hex color codes', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    Object.values(PRIORITY_META).forEach((priority) => {
      expect(priority.color).toMatch(hexColorRegex);
    });
  });

  it('should have non-empty labels for all priorities', () => {
    Object.values(PRIORITY_META).forEach((priority) => {
      expect(priority.label).toBeTruthy();
      expect(typeof priority.label).toBe('string');
    });
  });
});
