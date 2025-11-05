export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('onboarding_fields', {
    field_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    step_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'onboarding_steps', key: 'step_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    field_key: { type: Sequelize.STRING(50), allowNull: false },
    label: { type: Sequelize.STRING(120), allowNull: false },
    input_type: { type: Sequelize.STRING(30), allowNull: false },
    required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    order_index: { type: Sequelize.INTEGER, allowNull: true },
    metadata: { type: Sequelize.JSONB, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });
  await queryInterface.addIndex('onboarding_fields', ['step_id'], { name: 'onboarding_fields_step_idx' });
  await queryInterface.addConstraint('onboarding_fields', { type: 'unique', fields: ['step_id', 'field_key'], name: 'onboarding_fields_step_field_key_uq' });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('onboarding_fields');
}
