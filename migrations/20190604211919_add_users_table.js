
exports.up = function(knex, Promise) {
  return knex.schema.createTable('Users', table => {
    table.string('Id').primary().index()
    table.integer('Credits').notNullable()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('Users')
};
