create table grouper_status (setting varchar(255) PRIMARY KEY, value varchar(255));

create table grouper_group_definitions (group_id varchar(255) PRIMARY KEY,
       grouper_group_id varchar(255) NOT NULL,
       sakai_group_id varchar(255) NOT NULL,
       description varchar(512) NOT NULL,
       deleted int default 0,
       mtime BIGINT NOT NULL);

create index grouper_groups_sakai_id on grouper_group_definitions (sakai_group_id);

create table grouper_group_users (group_id varchar(255), netid varchar(255), role varchar(30),
       PRIMARY KEY (group_id, netid),
       FOREIGN KEY (group_id) references grouper_group_definitions (group_id));

create index grouper_group_definitions_role on grouper_group_users (role);

-- Tables/views exposed to grouper
create view grouper_groups as select grouper_group_id as group_id, description from grouper_group_definitions where deleted != 1;

create or replace view grouper_memberships as select gd.grouper_group_id as group_id, u.netid, gd.description as group_description
from grouper_group_definitions gd
inner join grouper_group_users u on u.group_id = gd.group_id
where u.role = 'viewer';

create or replace view grouper_managers as select gd.grouper_group_id as group_id, u.netid, gd.description as group_description
from grouper_group_definitions gd
inner join grouper_group_users u on u.group_id = gd.group_id
where u.role = 'manager';

create table grouper_sync_status (group_id varchar(255) PRIMARY KEY,
       grouper_group_id varchar(255) NOT NULL,
       status varchar(100));

create index grouper_sync_status_grpid on grouper_sync_status (grouper_group_id);
