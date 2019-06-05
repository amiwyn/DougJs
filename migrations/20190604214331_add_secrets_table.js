
exports.up = function(knex, Promise) {
  return knex.schema.createTable('Secrets', table => {
    table.string('Id').primary().index()
    table.string('Secret').notNullable()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('Secrets')
};
