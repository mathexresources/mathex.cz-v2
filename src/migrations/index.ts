import * as migration_20261025_190000_initial from './20261025_190000_initial';
import * as migration_20261025_220622_blocked_times_calendar from './20261025_220622_blocked_times_calendar';

export const migrations = [
  {
    up: migration_20261025_190000_initial.up,
    down: migration_20261025_190000_initial.down,
    name: '20261025_190000_initial',
  },
  {
    up: migration_20261025_220622_blocked_times_calendar.up,
    down: migration_20261025_220622_blocked_times_calendar.down,
    name: '20261025_220622_blocked_times_calendar'
  },
];
