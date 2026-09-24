import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmployeeTable1790250636832 implements MigrationInterface {
    name = 'CreateEmployeeTable1790250636832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_hr_admins_email\` ON \`hr_admins\``);
        await queryRunner.query(`DROP INDEX \`IDX_organizations_code\` ON \`organizations\``);
        await queryRunner.query(`CREATE TABLE \`employees\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`full_name\` varchar(255) NOT NULL, \`mobile\` varchar(20) NOT NULL, \`organization_id\` varchar(36) NOT NULL, \`status\` enum ('active', 'inactive', 'pending_onboarding') NOT NULL DEFAULT 'pending_onboarding', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_765bc1ac8967533a04c74a9f6a\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`hr_admins\` ADD UNIQUE INDEX \`IDX_1ad68ecda47433865e96113bd5\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`organizations\` ADD UNIQUE INDEX \`IDX_7e27c3b62c681fbe3e2322535f\` (\`code\`)`);
        await queryRunner.query(`ALTER TABLE \`organizations\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`organizations\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`organizations\` CHANGE \`updated_at\` \`updated_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`organizations\` CHANGE \`created_at\` \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`organizations\` DROP INDEX \`IDX_7e27c3b62c681fbe3e2322535f\``);
        await queryRunner.query(`ALTER TABLE \`hr_admins\` DROP INDEX \`IDX_1ad68ecda47433865e96113bd5\``);
        await queryRunner.query(`DROP INDEX \`IDX_765bc1ac8967533a04c74a9f6a\` ON \`employees\``);
        await queryRunner.query(`DROP TABLE \`employees\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_organizations_code\` ON \`organizations\` (\`code\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_hr_admins_email\` ON \`hr_admins\` (\`email\`)`);
    }

}
