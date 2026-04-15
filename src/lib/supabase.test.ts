import { supabase } from './supabase';

describe('Supabase Client', () => {
  it('should export a supabase instance', () => {
    expect(supabase).toBeDefined();
  });

  it('should have auth methods', () => {
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.auth.getUser).toBe('function');
  });

  it('should have from method for queries', () => {
    expect(typeof supabase.from).toBe('function');
  });

  it('should have channel method for real-time', () => {
    expect(typeof supabase.channel).toBe('function');
  });
});
