import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1793700657310 implements MigrationInterface {
    name = 'InitialSchema1793700657310'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // יצירת טבלאות בצורה בטוחה
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`nodes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`projectId\` int NOT NULL, \`label\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, \`metadata\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`projects\` (\`id\` int NOT NULL AUTO_INCREMENT, \`repo_url\` varchar(255) NOT NULL, \`repo_name\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`owner_id\` varchar(255) NOT NULL, INDEX \`IDX_b1bd2fbf5d0ef67319c91acb5c\` (\`owner_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`edges\` (\`id\` int NOT NULL AUTO_INCREMENT, \`projectId\` int NOT NULL, \`sourceNodeId\` int NOT NULL, \`targetNodeId\` int NOT NULL, \`relationType\` varchar(255) NOT NULL, \`label\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        // הוספת קשרי Foreign Key בצורה בטוחה מפני כפילויות (שגיאה 1826)
        const foreignKeys = [
            `ALTER TABLE \`nodes\` ADD CONSTRAINT \`FK_8a345bb265a417e971008f22928\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
            `ALTER TABLE \`edges\` ADD CONSTRAINT \`FK_9c09b51636c48d69e61b38e7ec4\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
            `ALTER TABLE \`edges\` ADD CONSTRAINT \`FK_26d0bab9fcdf980732b460f56a4\` FOREIGN KEY (\`sourceNodeId\`) REFERENCES \`nodes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
            `ALTER TABLE \`edges\` ADD CONSTRAINT \`FK_90b117775a6e9469569c70d00a2\` FOREIGN KEY (\`targetNodeId\`) REFERENCES \`nodes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
        ];

        for (const query of foreignKeys) {
            try {
                await queryRunner.query(query);
            } catch (error: any) {
                // אם הקשר כבר קיים (ER_FK_DUP_NAME / errno 1826), נתעלם מהשגיאה ונמשיך
                if (error.errno !== 1826) {
                    throw error;
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE IF EXISTS \`edges\` DROP FOREIGN KEY \`FK_90b117775a6e9469569c70d00a2\``);
        await queryRunner.query(`ALTER TABLE IF EXISTS \`edges\` DROP FOREIGN KEY \`FK_26d0bab9fcdf980732b460f56a4\``);
        await queryRunner.query(`ALTER TABLE IF EXISTS \`edges\` DROP FOREIGN KEY \`FK_9c09b51636c48d69e61b38e7ec4\``);
        await queryRunner.query(`ALTER TABLE IF EXISTS \`nodes\` DROP FOREIGN KEY \`FK_8a345bb265a417e971008f22928\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`edges\``);
        await queryRunner.query(`DROP INDEX IF EXISTS \`IDX_b1bd2fbf5d0ef67319c91acb5c\` ON \`projects\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`projects\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`nodes\``);
    }
}