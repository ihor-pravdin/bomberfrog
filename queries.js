'use strict';

const select_lists_query = 'select * from lists order by list_id desc limit ? offset ?;';

const select_list_query = 'select * from lists where name = ?;';

const insert_list_query = 'insert into lists (name, worker, description, options, updated_at) values (?, ?, ?, ?, NULL)';

const update_list_status_query = 'update lists set status = ? where name = ?;';

// language=SQL format=false
const create_list_table_query = `
    create table if not exists lists (
        list_id int unsigned NOT NULL AUTO_INCREMENT,
        name varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        description text CHARACTER SET utf8 COLLATE utf8_general_ci,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status tinyint NOT NULL DEFAULT '0',
        worker varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        options json DEFAULT NULL,
        PRIMARY KEY (list_id),
        UNIQUE KEY name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
`;

module.exports = {
    select_lists_query,
    select_list_query,
    insert_list_query,
    update_list_status_query,
    create_list_table_query
};
