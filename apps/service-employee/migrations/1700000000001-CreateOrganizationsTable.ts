import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationsTable1700000000001 implements MigrationInterface {
  name = 'CreateOrganizationsTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`organizations\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`code\` varchar(32) NOT NULL,
        \`contact_email\` varchar(255) NOT NULL,
        \`currency\` varchar(3) NOT NULL DEFAULT 'INR',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX \`IDX_organizations_code\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`organizations\``);
  }
}
