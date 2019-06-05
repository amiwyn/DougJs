
exports.up = function(knex, Promise) {
  return knex.schema.createTable('Slurs', table => {
    table.increments('Id').primary().index()
    table.string('CreatedBy').notNullable()
    table.string('Text').notNullable()
    table.boolean('Active').notNullable()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('Slurs')
};
