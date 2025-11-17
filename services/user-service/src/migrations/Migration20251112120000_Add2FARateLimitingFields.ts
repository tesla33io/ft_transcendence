import { Migration } from '@mikro-orm/migrations';

export class Migration20251112120000_Add2FARateLimitingFields extends Migration {

  override async up(): Promise<void> {
    // Add rate limiting fields for 2FA
    this.addSql(`alter table \`user\` add column \`two_factor_failed_attempts\` integer not null default 0;`);
    this.addSql(`alter table \`user\` add column \`two_factor_locked_until\` datetime null;`);
  }

  override async down(): Promise<void> {
    // Remove rate limiting fields
    this.addSql(`alter table \`user\` drop column \`two_factor_failed_attempts\`;`);
    this.addSql(`alter table \`user\` drop column \`two_factor_locked_until\`;`);
  }

}