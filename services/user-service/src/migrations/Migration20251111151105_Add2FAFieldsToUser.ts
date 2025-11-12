import { Migration } from '@mikro-orm/migrations';

export class Migration20251111151105_Add2FAFieldsToUser extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index \`session_user_id_index\`;`);

    this.addSql(`alter table \`user\` add column \`email\` text null;`);
    this.addSql(`alter table \`user\` add column \`two_factor_method\` text null;`);
  }

}
