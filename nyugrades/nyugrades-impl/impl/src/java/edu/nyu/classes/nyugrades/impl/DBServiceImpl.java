package edu.nyu.classes.nyugrades.impl;

import edu.nyu.classes.nyugrades.api.DBService;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import org.sakaiproject.component.cover.ComponentManager;
import org.sakaiproject.db.api.SqlService;

//
// A note on PreparedStatements!
//
// At the moment, prepared statements are generated, used, then discarded
// without re-use.  Since the NYUGrades service will only be consumed by
// PeopleSoft (and not hit especially heavily), it's unlikely that caching
// PreparedStatements would yield a noticeable performance benefit, so it's hard
// to justify the complexity of adding caching
//
// However, if this should ever change, this class would be a good place to add
// caching.  A simple approach would be to modify executeUpdate and executeQuery
// to use a new method (instead of connection.prepareStatement(sql)) that would
// attempt to find an existing PreparedStatement for a given piece of SQL before
// creating a new one.
//
// A good candidate for such a cache might be an LRU Map like the one from
// Apache Commons:
//
//   http://commons.apache.org/proper/commons-collections/javadocs/api-3.2.1/org/apache/commons/collections/map/LRUMap.html
//

public class DBServiceImpl implements DBService
{
    private SqlService sqlService;


    public void init()
    {
        sqlService = (SqlService) ComponentManager.get(SqlService.class.getName());
    }


    public boolean isOracle()
    {
        return sqlService.getVendor().equals("oracle");
    }


    private void loadParameters(PreparedStatement ps, Object[] args)
        throws SQLException
    {
        int i = 1;

        for (Object arg : args) {
            if (arg instanceof String) {
                ps.setString(i, (String)arg);
            } else if (arg instanceof Integer) {
                ps.setInt(i, ((Integer) arg).intValue());
            } else {
                throw new RuntimeException("Unknown parameter type: " + arg);
            }

            i++;
        }
    }


    public int executeUpdate(String sql, Object... args)
    {
        Connection connection = null;
        PreparedStatement ps = null;
        try {
            connection = sqlService.borrowConnection();
            ps = connection.prepareStatement(sql);
            loadParameters(ps, args);

            int updatedCount = ps.executeUpdate();

            if (!connection.getAutoCommit()) {
                connection.commit();
            }

            return updatedCount;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        } finally {
            if (ps != null) {
                try { ps.close (); } catch (Exception e) {}
            }

            sqlService.returnConnection (connection);
        }
    }


    public List<Object[]> executeQuery(String sql, Object... args)
    {
        Connection connection = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            connection = sqlService.borrowConnection();
            ps = connection.prepareStatement(sql);
            loadParameters(ps, args);

            rs = ps.executeQuery();
            List<Object[]> result = new ArrayList<Object[]>();

            while (rs.next()) {
                int columns = rs.getMetaData().getColumnCount();
                Object[] row = new Object[columns];
                for (int i = 0; i < columns; i++) {
                    row[i] = rs.getObject(i + 1);
                }

                result.add(row);
            }

            return result;

        } catch (SQLException e) {
            throw new RuntimeException(e);
        } finally {
            if (rs != null) {
                try { rs.close (); } catch (Exception e) {}
            }

            if (ps != null) {
                try { ps.close (); } catch (Exception e) {}
            }

            sqlService.returnConnection (connection);
        }
    }
}
