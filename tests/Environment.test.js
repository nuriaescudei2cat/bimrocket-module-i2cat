/*
 * Environment.test.js
 *
 * Unit tests for Environment.js
 *
 */

import { Environment } from '../../../Environment.js';

describe('Environment Configuration', () => {
  
  it('should be defined as a valid object', () => {
    expect(Environment).toBeDefined();
    expect(typeof Environment).toBe('object');
  });

  describe('SERVER_URL property', () => {
    it('should be a string', () => {
      expect(typeof Environment.SERVER_URL).toBe('string');
    });

    it('should point to the correct local bimrocket-server endpoint', () => {
      expect(Environment.SERVER_URL).toBe('http://localhost:9090/bimrocket-server');
    });
  });

  describe('MODULES property', () => {
    it('should be an array', () => {
      expect(Array.isArray(Environment.MODULES)).toBe(true);
    });

    it('should contain exactly 5 modules', () => {
      expect(Environment.MODULES).toHaveLength(5);
    });

    it('should include all configured modules in order', () => {
      expect(Environment.MODULES).toEqual([
        'base',
        'analysis',
        'bim',
        'gis',
        'i2cat',
      ]);
    });
    
    it('should contain "base" module regardless of order', () => {
      expect(Environment.MODULES).toEqual(expect.arrayContaining(['base']));
    });
  });

});