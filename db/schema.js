import {
  mysqlTable,
  int,
  varchar,
  text,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';

export const devices = mysqlTable('devices', {
  id: int('id').autoincrement().primaryKey(),
  device: varchar('device', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['on', 'off']).default('off'),
  room: varchar('room', { length: 255 }).notNull(),
  description: text('description'),
  image: varchar('image', { length: 255 }),
});
