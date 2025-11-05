export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('onboarding_answers', {
    answer_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    session_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'onboarding_sessions', key: 'session_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    step_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'onboarding_steps', key: 'step_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
    answers: { type: Sequelize.JSONB, allowNull: false },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });
  await queryInterface.addIndex('onboarding_answers', ['session_id'], { name: 'onboarding_answers_session_idx' });
  await queryInterface.addIndex('onboarding_answers', ['step_id'], { name: 'onboarding_answers_step_idx' });
  await queryInterface.addConstraint('onboarding_answers', { type: 'unique', fields: ['session_id', 'step_id'], name: 'onboarding_answers_session_step_uq' });
}
