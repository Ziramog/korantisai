import * as path from 'path';
import * as dotenv from 'dotenv';

const root = path.join(__dirname, '..', '..');

dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

