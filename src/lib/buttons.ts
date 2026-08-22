import type { CSSProperties } from 'react';

export function filterChipStyle(on: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: on ? '#1c3b2c' : '#fff',
    color: on ? '#f6f3ea' : '#4b5142',
    border: `1px solid ${on ? '#1c3b2c' : '#e0d9c6'}`,
    padding: '8px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

export function filterCountStyle(on: boolean): CSSProperties {
  return {
    background: on ? 'rgba(246,243,234,.2)' : '#eef2e9',
    color: on ? '#f6f3ea' : '#6f7566',
    fontSize: 10.5,
    padding: '1px 7px',
    borderRadius: 10,
  };
}

export function actionBtnStyle(primary?: boolean, danger?: boolean): CSSProperties {
  return {
    background: primary ? '#1c3b2c' : 'none',
    color: danger ? '#b0361f' : primary ? '#f6f3ea' : '#4b5142',
    border: `1px solid ${danger ? '#e0b3a6' : primary ? '#1c3b2c' : '#c3bba6'}`,
    padding: '7px 11px',
    borderRadius: 3,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

export function chipStyle(on: boolean): CSSProperties {
  return {
    background: on ? '#1c3b2c' : '#faf8f2',
    color: on ? '#f6f3ea' : '#4b5142',
    border: `1px solid ${on ? '#1c3b2c' : '#d8cfb8'}`,
    padding: '8px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

export function avatarBtnStyle(danger?: boolean): CSSProperties {
  return {
    background: '#fff',
    color: danger ? '#b0361f' : '#1c3b2c',
    border: `1px solid ${danger ? '#e0b3a6' : '#c3bba6'}`,
    padding: '8px 13px',
    borderRadius: 20,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
