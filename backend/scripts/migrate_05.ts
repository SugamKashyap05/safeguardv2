
import { migrate } from '../src/utils/migrate';

migrate('05_search_history.sql')
    .then(() => console.log('Migration 05_search_history complete'))
    .catch(err => console.error('Migration failed', err));
