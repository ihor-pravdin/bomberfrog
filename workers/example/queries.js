'use strict';

const create_worker_table_query = `
    CREATE TABLE IF NOT EXISTS \`?\` (
          id int unsigned NOT NULL AUTO_INCREMENT,
          created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;    
`;

module.exports = {
    create_worker_table_query
};
