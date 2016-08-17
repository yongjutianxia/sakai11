/**********************************************************************************
 * $URL$
 * $Id$
 ***********************************************************************************
 *
 * Copyright (c) 2003, 2004, 2005, 2006, 2007, 2008 The Sakai Foundation
 *
 * Licensed under the Educational Community License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 **********************************************************************************/

package edu.nyu.classes.providers;

import com.unboundid.ldap.sdk.migrate.ldapjdk.LDAPEntry;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.List;
import java.util.ArrayList;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.sakaiproject.db.api.SqlService;
import org.sakaiproject.component.cover.ServerConfigurationService;

import org.sakaiproject.unboundid.SimpleLdapAttributeMapper;
import org.sakaiproject.unboundid.LdapUserData;

public class NYULdapAttributeMapper extends SimpleLdapAttributeMapper
{
    private static Log M_log = LogFactory.getLog(NYULdapAttributeMapper.class);


    private static String likeClause(String whereValue) {
        return whereValue.toLowerCase() + "%";
    }


    private static List<String> lookupUsersTable(String selectColumn, String whereColumn, String whereValue, boolean useLike) {

        List<String> result = new ArrayList<String>();

        try {
            SqlService sqlService = null;
            try {
                sqlService = (SqlService) org.sakaiproject.component.cover.ComponentManager.get("org.sakaiproject.db.api.SqlService");
            } catch (Throwable e) {
                M_log.warn("lookupUsersTable: can't get SQL service: " + e);
            }

            if (sqlService == null) {
                return result;
            }

            Connection db = sqlService.borrowConnection();

            try {
                String operator = useLike ? "LIKE" : "=";
                String value = useLike ? likeClause(whereValue) : whereValue.toLowerCase();

                PreparedStatement ps = db.prepareStatement("select " + selectColumn +
                        " from NYU_T_USERS " +
                        "where lower(" + whereColumn + ") " + operator + " ?");
                ps.setString(1, value);

                ResultSet rs = ps.executeQuery();
                try {
                    while (rs.next()) {
                        result.add(rs.getString(1));
                    }
                } finally {
                    rs.close();
                }
            } finally {
                sqlService.returnConnection(db);
            }
        } catch (SQLException e) {
            M_log.warn("lookupUsersTable: " + e);
        }

        return result;
    }



    private static String firstOrNull(List<String> coll) {
        if (coll.isEmpty()) {
            return null;
        }

        return coll.get(0);
    }


    public static String getNetIdForEmail(String email) {
        return firstOrNull(lookupUsersTable("netid", "email", email, false));
    }


    public static String getEmailForNetId(String netid) {
        return firstOrNull(lookupUsersTable("email", "netid", netid, false));
    }


    public static List<String> getMatchingNetIds(String criteria) {
        return lookupUsersTable("netid", "email", criteria, true);
    }


    public static boolean isOverrideActive() {
        return ServerConfigurationService.getBoolean("edu.nyu.classes.ldap.emailsFromDB", false);
    }


    @Override
    public void mapLdapEntryOntoUserData(LDAPEntry ldapEntry, LdapUserData userData) {
        super.mapLdapEntryOntoUserData(ldapEntry, userData);

        try {
            boolean useDBOverride = ServerConfigurationService.getBoolean("edu.nyu.classes.ldap.emailsFromDB", false);

            if (isOverrideActive()) {
                String emailSuffix = ServerConfigurationService.getString("edu.nyu.classes.ldap.emailSuffix", "@nyu.edu");
                String email = getEmailForNetId(userData.getEid());

                // Override the user's email address with the value from the database
                if (email != null) {
                    userData.setEmail(email);
                }

                // If we still don't have an email address in spite of our best efforts, base it off the Net ID
                if (userData.getEmail() == null) {
                    String netid = userData.getEid();
                    if (netid != null) {
                        userData.setEmail(netid + emailSuffix);
                    }
                }
            }
        } catch (Throwable ex) {
            // If *anything* goes wrong just leave it.
        }
    }

}
