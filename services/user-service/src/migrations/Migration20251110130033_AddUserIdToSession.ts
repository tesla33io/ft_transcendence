import { Migration } from '@mikro-orm/migrations';

export class Migration20251110130033_AddUserIdToSession extends Migration {

  override async up(): Promise<void> {
    this.addSql('alter table `session` add column `user_id` integer;');
    this.addSql('update `session` set `user_id` = json_extract(data, \'$.userId\');');
    this.addSql('create index `session_user_id_index` on `session` (`user_id`);');
  }

  override async down(): Promise<void> {
    this.addSql('drop index if exists `session_user_id_index`;');
    this.addSql('alter table `session` drop column `user_id`;');
  }

}
