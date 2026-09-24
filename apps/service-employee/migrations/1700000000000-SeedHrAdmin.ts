import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedHrAdmin1700000000000 implements MigrationInterface {
  name = 'SeedHrAdmin1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`hr_admins\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_hr_admins_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );

    await queryRunner.query(
      `INSERT INTO \`hr_admins\` (\`id\`, \`email\`, \`password_hash\`) VALUES (UUID(), 'admin@salarymgmt.com', 'admin123')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`hr_admins\``);
  }
}
