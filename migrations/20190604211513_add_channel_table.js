
exports.up = function(knex, Promise) {
  return knex.schema.createTable('Channels', table => {
    table.integer('Id').primary().index()
    table.string('Channel').notNullable()
    table.string('Token').notNullable()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('Channels')
};
