import { Migration } from '@mikro-orm/migrations';

export class Migration20251111151105_Add2FAFieldsToUser extends Migration {

  override async up(): Promise<void> {
    // Add 2FA fields to user table
    this.addSql(`alter table \`user\` add column \`email\` text null;`);
    this.addSql(`alter table \`user\` add column \`two_factor_method\` text null;`);

     // Note: session_user_id_index will be created automatically by MikroORM
    // based on the @Index decorator in the Session entity
  }

}
