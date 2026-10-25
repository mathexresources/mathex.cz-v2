import * as migration_20261025_190000_initial from './20261025_190000_initial';

export const migrations = [
  {
    up: migration_20261025_190000_initial.up,
    down: migration_20261025_190000_initial.down,
    name: '20261025_190000_initial'
  },
];
