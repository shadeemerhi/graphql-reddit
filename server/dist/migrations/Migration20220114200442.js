"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20220114200442 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20220114200442 extends migrations_1.Migration {
    async up() {
        this.addSql('alter table "user" add column "email" text not null;');
        this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');
        this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');
    }
}
exports.Migration20220114200442 = Migration20220114200442;
//# sourceMappingURL=Migration20220114200442.js.map