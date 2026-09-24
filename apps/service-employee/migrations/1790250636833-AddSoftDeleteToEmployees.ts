import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToEmployees1790250636833 implements MigrationInterface {
    name = 'AddSoftDeleteToEmployees1790250636833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`employees\` ADD \`is_active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`employees\` ADD \`deleted_at\` timestamp NULL DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`employees\` DROP COLUMN \`deleted_at\``);
        await queryRunner.query(`ALTER TABLE \`employees\` DROP COLUMN \`is_active\``);
    }

}
