import { describe, it, expect } from 'vitest';
import { createAccessCode, isValidAccessCode, createSession, joinSession } from './sessionService.js';

describe('session service', () => {
  it('creates a valid access code', () => {
    const code = createAccessCode();
    expect(code).toMatch(/^[0-9A-F]{6}$/);
  });

  it('validates hex access codes', () => {
    expect(isValidAccessCode('A91F03')).toBe(true);
    expect(isValidAccessCode('A91F0')).toBe(false);
    expect(isValidAccessCode('ZZZZZZ')).toBe(false);
  });

  it('creates and joins a session', () => {
    const session = createSession();
    const joined = joinSession(session.accessCode, 'Chrome Laptop');

    expect(session.accessCode).toMatch(/^[0-9A-F]{6}$/);
    expect(joined?.sessionId).toBe(session.sessionId);
    expect(joined?.connectedDevices).toContain('Chrome Laptop');
  });
});
