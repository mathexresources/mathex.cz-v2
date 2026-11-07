import * as migration_20261025_190000_initial from './20261025_190000_initial';
import * as migration_20261025_220622_blocked_times_calendar from './20261025_220622_blocked_times_calendar';
import * as migration_20261025_222302_services_lectures from './20261025_222302_services_lectures';
import * as migration_20261025_230000_broaden_content from './20261025_230000_broaden_content';
import * as migration_20261107_120000_poster_home from './20261107_120000_poster_home';

export const migrations = [
  {
    up: migration_20261025_190000_initial.up,
    down: migration_20261025_190000_initial.down,
    name: '20261025_190000_initial',
  },
  {
    up: migration_20261025_220622_blocked_times_calendar.up,
    down: migration_20261025_220622_blocked_times_calendar.down,
    name: '20261025_220622_blocked_times_calendar',
  },
  {
    up: migration_20261025_222302_services_lectures.up,
    down: migration_20261025_222302_services_lectures.down,
    name: '20261025_222302_services_lectures',
  },
  {
    up: migration_20261025_230000_broaden_content.up,
    down: migration_20261025_230000_broaden_content.down,
    name: '20261025_230000_broaden_content',
  },
  {
    up: migration_20261107_120000_poster_home.up,
    down: migration_20261107_120000_poster_home.down,
    name: '20261107_120000_poster_home',
  },
];
